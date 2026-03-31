// src/components/PickupPool.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { gsap } from "gsap";
import {
  Loader2,
  RefreshCcw,
  QrCode,
  Search,
  PackageOpen,
  CheckCircle2,
  Send,
  ChevronDown,
  MapPin,
  User,
  Calendar,
  Hash,
} from "lucide-react";
import ScannerOverlay from "./ScannerOverlay.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { ensureCameraPermission, startWebQrScanner } from "../lib/scanner.js";
import {
  parseOrderNumberFromScan,
  fetchAwaitingPickupOrders,
  fetchMyInTransit,
  claimPickupByOrderNo,
  sendOrderOtp,
} from "../lib/api.js";

const safe = (v, fb = "-") => (v === null || v === undefined ? fb : String(v));

/* ── Card ─────────────────────────────────────────────────────── */
function OrderCard({ order, actionSlot, delay = 0 }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const tween = gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", delay }
    );
    return () => { tween.kill(); };
  }, [delay]);

  const statusVal = order.currentStatus || order.orderStatus;
  const dateStr = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString()
    : "-";

  return (
    <article
      ref={cardRef}
      className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] mx-4 mb-3 overflow-hidden"
    >
      {/* Top row */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-[#DDDDDD]">
        <div>
          <div className="text-xs text-[var(--muted)] mb-0.5">Order</div>
          <div className="text-[15px] font-bold text-[var(--text)] break-all leading-tight">
            {safe(order.orderNo)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge value={statusVal} />
          <span className="text-[11px] text-[var(--muted)]">{dateStr}</span>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 space-y-2">
        {[
          { icon: User,     val: safe(order.customerName) },
          { icon: MapPin,   val: safe(order.city) + (order.country ? `, ${order.country}` : "") },
          { icon: Hash,     val: safe(order.trackingNumber) },
        ].map(({ icon: Icon, val }, i) => (
          <div key={i} className="flex items-center gap-2">
            <Icon size={13} className="text-[var(--muted)] flex-shrink-0" />
            <span className="text-sm text-[var(--muted)] truncate">{val}</span>
          </div>
        ))}
      </div>

      {/* Items */}
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl bg-[#F7F7F7] px-3 py-2">
          <div className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">Items</div>
          <ul className="space-y-0.5">
            {order.items.slice(0, 4).map((it, idx) => (
              <li key={idx} className="flex justify-between text-xs text-[var(--text)]">
                <span className="truncate">{safe(it.productName || it.sku)}</span>
                <span className="font-semibold ml-2">×{safe(it.quantity ?? 1)}</span>
              </li>
            ))}
            {order.items.length > 4 && (
              <li className="text-[10px] text-[var(--muted)]">+{order.items.length - 4} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Action */}
      {actionSlot && (
        <div className="px-4 pb-4">{actionSlot}</div>
      )}
    </article>
  );
}

/* ── Main ─────────────────────────────────────────────────────── */
export default function PickupPool() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("pool");
  const [mineSub, setMineSub] = useState("undelivered");
  const [q, setQ] = useState("");

  const [pool, setPool] = useState({ items: [], page: 1, limit: 15, count: 0, loading: false, moreLoading: false });
  const [mine, setMine] = useState({ items: [], page: 1, limit: 20, count: 0, loading: false, moreLoading: false });

  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const scanDelayTimer = useRef(null);

  const [scanOpen, setScanOpen] = useState(false);
  const scannerDivId = "pickup-scan-div";
  const scannerRef = useRef(null);
  const [scannerKey, setScannerKey] = useState(0);

  const tabBarRef = useRef(null);
  const headerRef = useRef(null);
  const toastRef = useRef(null);

  /* Animate header on mount */
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    }
    if (tabBarRef.current) {
      gsap.fromTo(tabBarRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.15, ease: "power2.out" });
    }
  }, []);

  /* Animate toast */
  useEffect(() => {
    if (toast && toastRef.current) {
      gsap.fromTo(toastRef.current,
        { opacity: 0, y: 20, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.5)" }
      );
    }
  }, [toast]);

  const isDelivered = (ord) => {
    const pkg = ord?.__pkg;
    if (pkg?.pkgStatus) return String(pkg.pkgStatus).toUpperCase() === "DELIVERED";
    const s = (ord.currentStatus || ord.orderStatus || "").toUpperCase();
    return s === "DELIVERED";
  };

  const undeliveredMine = mine.items.filter((o) => !isDelivered(o));
  const deliveredMine = mine.items.filter((o) => isDelivered(o));
  const hasMorePool = pool.items.length < pool.count;
  const hasMoreMine = mine.items.length < mine.count;
  const currentList = tab === "pool" ? pool : mine;
  const hasMore = tab === "pool" ? hasMorePool : hasMoreMine;

  /* Loaders */
  const loadPool = useCallback(async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) setPool((s) => ({ ...s, loading: true }));
      else setPool((s) => ({ ...s, moreLoading: true }));
      const res = await fetchAwaitingPickupOrders({ page: reset ? 1 : pool.page, limit: pool.limit, unassigned: true, q: q.trim() || undefined });
      const next = Array.isArray(res.orders) ? res.orders : [];
      if (reset) setPool({ items: next, page: 2, limit: pool.limit, count: res.count || next.length, loading: false, moreLoading: false });
      else setPool((s) => ({ ...s, items: [...s.items, ...next], page: s.page + 1, count: res.count || s.count, moreLoading: false, loading: false }));
    } catch (e) {
      setError(e?.message || "Failed to load pool");
      setPool((s) => ({ ...s, loading: false, moreLoading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pool.page, pool.limit]);

  const loadMine = useCallback(async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) setMine((s) => ({ ...s, loading: true }));
      else setMine((s) => ({ ...s, moreLoading: true }));
      const res = await fetchMyInTransit({ page: reset ? 1 : mine.page, limit: mine.limit, q: q.trim() || undefined });
      const next = Array.isArray(res.orders) ? res.orders : [];
      if (reset) setMine({ items: next, page: 2, limit: mine.limit, count: res.count || next.length, loading: false, moreLoading: false });
      else setMine((s) => ({ ...s, items: [...s.items, ...next], page: s.page + 1, count: res.count || s.count, moreLoading: false, loading: false }));
    } catch (e) {
      setError(e?.message || "Failed to load my orders");
      setMine((s) => ({ ...s, loading: false, moreLoading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, mine.page, mine.limit]);

  useEffect(() => {
    loadPool({ reset: true });
    loadMine({ reset: true });
  }, []); // eslint-disable-line

  /* Search */
  const onSearch = (e) => {
    e?.preventDefault?.();
    if (tab === "pool") loadPool({ reset: true });
    else loadMine({ reset: true });
  };

  /* Scanner */
  const stopScanner = useCallback(async () => {
    try { await scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    const perm = await ensureCameraPermission();
    if (!perm.granted) { setError(t("camera_permission_denied")); setScanOpen(false); return; }
    if (scanDelayTimer.current) clearTimeout(scanDelayTimer.current);
    scanDelayTimer.current = setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            await stopScanner();
            setScanOpen(false);
            const orderNo = parseOrderNumberFromScan(decoded);
            if (!orderNo) return;
            try {
              await claimPickupByOrderNo(orderNo);
              setToast({ type: "success", msg: t("claimed_success") || "Claimed!" });
              if (toastTimer.current) clearTimeout(toastTimer.current);
              toastTimer.current = setTimeout(() => setToast(null), 2000);
              await loadPool({ reset: true });
              await loadMine({ reset: true });
            } catch (err) {
              setError(err?.message || "Claim failed");
            }
          },
          (err) => { setError(err || t("camera_init_failed")); setScanOpen(false); }
        );
        scannerRef.current = s;
      } catch { setError(t("camera_init_failed")); setScanOpen(false); }
    }, 80);
  }, [scannerDivId, stopScanner, t, loadPool, loadMine]);

  useEffect(() => {
    if (scanOpen) beginScan();
    return () => { stopScanner(); };
  }, [scanOpen, beginScan, stopScanner]);

  /* Cleanup all timers on unmount */
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (scanDelayTimer.current) clearTimeout(scanDelayTimer.current);
  }, []);

  /* Tab switch with GSAP */
  const handleTabSwitch = (newTab) => {
    setTab(newTab);
  };

  /* Action slots */
  const claimAction = (
    <button
      type="button"
      onClick={() => { setScannerKey((k) => k + 1); setScanOpen(true); }}
      className="w-full flex items-center justify-center gap-2 btn-outline-red btn text-sm font-semibold"
    >
      <QrCode size={16} />
      {t("scan_to_claim") || "Scan to Claim"}
    </button>
  );

  const sendOtpAction = (order) => (
    <button
      type="button"
      onClick={async () => {
        try {
          await sendOrderOtp(order.orderNo);
          setToast({ type: "success", msg: t("otp_sent") || "OTP sent" });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setToast(null), 2000);
        } catch (e) {
          setError(e?.message || "Failed to send OTP");
        }
      }}
      className="w-full flex items-center justify-center gap-2 btn-primary btn text-sm font-semibold"
    >
      <Send size={16} />
      {t("send_otp") || "Send OTP"}
    </button>
  );

  const deliveredBadge = (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold">
      <CheckCircle2 size={16} />
      {t("DELIVERED") || "Delivered"}
    </div>
  );

  /* Render */
  return (
    <section className="view-animate pb-2">
      {/* Header */}
      <div ref={headerRef} className="flex items-center justify-between px-4 py-4 bg-white border-b border-[#DDDDDD]">
        <h2 className="text-[17px] font-semibold text-[var(--text)]">
          {t("pickup_pool") || "Pickup Pool"}
        </h2>
        <button
          onClick={() => tab === "pool" ? loadPool({ reset: true }) : loadMine({ reset: true })}
          disabled={currentList.loading}
          className="p-2 rounded-full text-[var(--muted)] hover:bg-[#F7F7F7] transition-colors"
        >
          {currentList.loading
            ? <Loader2 size={18} className="animate-spin text-[#ffcc02]" />
            : <RefreshCcw size={18} />}
        </button>
      </div>

      {/* Main tabs */}
      <div ref={tabBarRef} className="px-4 pt-4 pb-0">
        <div className="pill-tabs mb-3">
          <button className={`pill-tab${tab === "pool" ? " active" : ""}`} onClick={() => handleTabSwitch("pool")}>
            {t("tab_pool") || "Pool"}
          </button>
          <button className={`pill-tab${tab === "mine" ? " active" : ""}`} onClick={() => handleTabSwitch("mine")}>
            {t("tab_mine") || "Mine"}
          </button>
        </div>

        {/* Sub-tabs for Mine */}
        {tab === "mine" && (
          <div className="pill-tabs mb-3">
            <button className={`pill-tab${mineSub === "undelivered" ? " active" : ""}`} onClick={() => setMineSub("undelivered")}>
              {t("mine_undelivered") || "Active"}
            </button>
            <button className={`pill-tab${mineSub === "delivered" ? " active" : ""}`} onClick={() => setMineSub("delivered")}>
              {t("mine_delivered") || "Delivered"}
            </button>
          </div>
        )}

        {/* Search */}
        <form onSubmit={onSearch} className="mb-4">
          <div className="search-bar">
            <Search size={16} className="text-[var(--muted)] flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search_orders") || "Search orders…"}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[#AAAAAA]"
            />
          </div>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      {/* Lists */}
      {currentList.loading && currentList.items.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-[var(--muted)]">
          <Loader2 size={28} className="animate-spin text-[#ffcc02] mb-3" />
          <span className="text-sm">{t("loading") || "Loading…"}</span>
        </div>
      ) : (tab === "pool" ? pool.items.length === 0 : mine.items.length === 0) ? (
        <div className="py-16 flex flex-col items-center justify-center text-[var(--muted)]">
          <PackageOpen size={40} className="mb-3 opacity-40" />
          <span className="text-sm">{t("no_orders") || "No orders"}</span>
        </div>
      ) : (
        <div className="mt-1">
          {tab === "pool" && pool.items.map((o, i) => (
            <OrderCard key={o._id || `${o.orderNo}-pool`} order={o} delay={i * 0.05} actionSlot={claimAction} />
          ))}

          {tab === "mine" && mineSub === "undelivered" && (
            undeliveredMine.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-[var(--muted)]">
                <PackageOpen size={40} className="mb-3 opacity-40" />
                <span className="text-sm">{t("no_orders") || "No active orders"}</span>
              </div>
            ) : undeliveredMine.map((o, i) => (
              <OrderCard key={o._id || `${o.orderNo}-mine-u`} order={o} delay={i * 0.05} actionSlot={sendOtpAction(o)} />
            ))
          )}

          {tab === "mine" && mineSub === "delivered" && (
            deliveredMine.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-[var(--muted)]">
                <CheckCircle2 size={40} className="mb-3 opacity-40" />
                <span className="text-sm">{t("no_delivered") || "No delivered orders"}</span>
              </div>
            ) : deliveredMine.map((o, i) => (
              <OrderCard key={o._id || `${o.orderNo}-mine-d`} order={o} delay={i * 0.05} actionSlot={deliveredBadge} />
            ))
          )}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="px-4 mt-2 mb-4">
          <button
            onClick={() => tab === "pool" ? loadPool({ reset: false }) : loadMine({ reset: false })}
            disabled={currentList.moreLoading}
            className="btn-outline btn w-full flex items-center justify-center gap-2"
          >
            {currentList.moreLoading
              ? <Loader2 size={16} className="animate-spin" />
              : <ChevronDown size={16} />}
            {t("load_more") || "Load more"}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          ref={toastRef}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] rounded-full px-5 py-3 shadow-lg text-white flex items-center gap-2"
          style={{ background: "linear-gradient(to right, #ffcc02, #e6b800)" }}
        >
          <CheckCircle2 size={18} />
          <span className="font-semibold text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Scanner */}
      <ScannerOverlay
        key={scannerKey}
        visible={scanOpen}
        onClose={async () => { await stopScanner(); setScanOpen(false); }}
        scannerDivId={scannerDivId}
        title={t("scan_to_claim") || "Scan to claim"}
      />
    </section>
  );
}
