// src/components/PickupPool.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RefreshCcw, ChevronDown, ChevronUp, QrCode, Search, PackageOpen, Send } from "lucide-react";
import ScannerOverlay from "./ScannerOverlay.jsx";
import StatusBadge from "./StatusBadge.jsx";
import {
  ensureCameraPermission,
  startWebQrScanner,
} from "../lib/scanner.js";
import {
  parseOrderNumberFromScan,
  fetchAwaitingPickupOrders,
  fetchMyInTransitOrders,
  claimPickupByOrderNo,
  sendOrderOtp,
} from "../lib/api.js";
import OtpModal from "./OtpModal.jsx";

const safeText = (v, { fallback = "-" } = {}) => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try { const j = JSON.stringify(v); return j.length > 160 ? j.slice(0,157)+"…" : j; } catch { return fallback; }
};

function Row({ order, collapsedDefault = true, rightEl, t }) {
  const [open, setOpen] = useState(!collapsedDefault);
  const statusVal = order.currentStatus || order.orderStatus;

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="w-full flex items-stretch justify-between px-3 py-2">
        <button onClick={() => setOpen(o => !o)} className="min-w-0 flex-1 text-left">
          <div className="overflow-x-auto no-scrollbar whitespace-nowrap pr-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">{safeText(order.orderNo)}</span>
            <span className="inline-block align-middle ml-2">
              <StatusBadge value={statusVal} />
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2 pl-2">
          {rightEl}
          <button onClick={() => setOpen(o => !o)} className="icon-btn px-2 py-1" aria-label={open ? "Collapse" : "Expand"}>
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-500 dark:text-slate-400">{t("customer")}</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">{safeText(order.customerName)}</div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-500 dark:text-slate-400">{t("city")}</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">
                {safeText(order.city)}{order.country ? `, ${safeText(order.country)}` : ""}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-500 dark:text-slate-400">{t("order_date")}</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">
                {order.orderDate ? new Date(order.orderDate).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-500 dark:text-slate-400">{t("tracking_number")}</div>
              <div className="font-medium text-slate-800 dark:text-slate-100 break-all">
                {safeText(order.trackingNumber)}
              </div>
            </div>
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mt-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t("items")}</div>
              <ul className="list-disc pl-5 space-y-1">
                {order.items.slice(0,5).map((it, idx) => (
                  <li key={idx} className="text-sm text-slate-700 dark:text-slate-200">
                    {safeText(it.productName || it.sku)} × {safeText(it.quantity ?? 1)}
                  </li>
                ))}
                {order.items.length > 5 && (
                  <li className="text-xs text-slate-500 dark:text-slate-400">
                    +{order.items.length - 5} {t("more")}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function PickupPool() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("pool"); // "pool" | "mine"
  const [q, setQ] = useState("");

  const [pool, setPool] = useState({ items: [], page: 1, limit: 15, count: 0, loading: false, moreLoading: false });
  const [mine, setMine] = useState({ items: [], page: 1, limit: 20, count: 0, loading: false, moreLoading: false });
  const [error, setError] = useState("");

  // OTP modal handled for MINE
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpOrder, setOtpOrder] = useState(null);

  // scanner for claim (POOL)
  const [scanOpen, setScanOpen] = useState(false);
  const scannerDivId = "pickup-scan-div";
  const scannerRef = useRef(null);
  const [scannerKey, setScannerKey] = useState(0);
  const [toast, setToast] = useState(null);
  const pendingOrderToClaim = useRef(null);

  const hasMorePool = pool.items.length < pool.count;
  const hasMoreMine = mine.items.length < mine.count;

  const loadPool = useCallback(async ({ reset = false } = {}) => {
    try{
      setError("");
      if (reset) setPool(s => ({ ...s, loading:true }));
      else setPool(s => ({ ...s, moreLoading:true }));

      const res = await fetchAwaitingPickupOrders({
        page: reset ? 1 : pool.page,
        limit: pool.limit,
        unassigned: true,
        q: q.trim() || undefined,
      });

      const next = Array.isArray(res.orders) ? res.orders : [];
      if (reset){
        setPool({ items: next, page: 2, limit: pool.limit, count: res.count || next.length, loading:false, moreLoading:false });
      }else{
        setPool(s => ({ ...s, items:[...s.items, ...next], page:s.page+1, count: res.count || s.count, moreLoading:false, loading:false }));
      }
    }catch(e){
      setError(e?.message || "Failed to load pool");
      setPool(s => ({ ...s, loading:false, moreLoading:false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pool.page, pool.limit]);

  // MINE uses /orders/my-in-transit (server-side paginated)
  const loadMine = useCallback(async ({ reset = false } = {}) => {
    try{
      setError("");
      if (reset) setMine(s => ({ ...s, loading:true }));
      else setMine(s => ({ ...s, moreLoading:true }));

      const res = await fetchMyInTransitOrders({
        page: reset ? 1 : mine.page,
        limit: mine.limit,
      });

      const next = Array.isArray(res.orders) ? res.orders : [];
      if (reset){
        setMine({ items: next, page: 2, limit: mine.limit, count: res.count || next.length, loading:false, moreLoading:false });
      }else{
        setMine(s => ({ ...s, items:[...s.items, ...next], page:s.page+1, count: res.count || s.count, moreLoading:false, loading:false }));
      }
    }catch(e){
      setError(e?.message || "Failed to load my claimed");
      setMine(s => ({ ...s, loading:false, moreLoading:false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine.page, mine.limit]);

  useEffect(() => {
    loadPool({ reset:true });
    loadMine({ reset:true });
  }, []); // eslint-disable-line

  const onSearch = (e) => {
    e?.preventDefault?.();
    if (tab === "pool") loadPool({ reset:true });
    else loadMine({ reset:true });
  };

  const stopScanner = useCallback(async () => {
    try{ await scannerRef.current?.stop?.(); }catch{}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    const perm = await ensureCameraPermission();
    if (!perm.granted){ setError(t("camera_permission_denied")); setScanOpen(false); return; }
    setTimeout(async () => {
      try{
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            await stopScanner();
            setScanOpen(false);
            const ordFromQr = parseOrderNumberFromScan(decoded);
            const orderNo = ordFromQr || pendingOrderToClaim.current;
            if (!orderNo) return;

            try{
              await claimPickupByOrderNo(orderNo);
              setToast({ type:"success", msg:t("claimed_success") });
              setTimeout(() => setToast(null), 1200);
              await loadPool({ reset:true });
              await loadMine({ reset:true }); // refresh "mine" so it appears there
            }catch(err){
              setError(err?.message || "Claim failed");
            }
          },
          (err) => { setError(err || t("camera_init_failed")); setScanOpen(false); }
        );
        scannerRef.current = s;
      }catch{
        setError(t("camera_init_failed"));
        setScanOpen(false);
      }
    }, 80);
  }, [scannerDivId, stopScanner, t, loadPool, loadMine]);

  useEffect(() => {
    if (scanOpen) beginScan();
    return () => { stopScanner(); };
  }, [scanOpen, beginScan, stopScanner]);

  const currentList = tab === "pool" ? pool : mine;
  const hasMore = tab === "pool" ? hasMorePool : hasMoreMine;

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("pickup_pool")}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (tab==="pool") loadPool({ reset:true }); else loadMine({ reset:true }); }}
            disabled={currentList.loading}
            className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-2"
          >
            {currentList.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("pool")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${tab==="pool" ? "text-white brand-gradient border-transparent" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"}`}
        >
          {t("tab_pool")}
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`px-3 py-1.5 rounded-lg text-sm border ${tab==="mine" ? "text-white brand-gradient border-transparent" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"}`}
        >
          {t("tab_mine")}
        </button>
      </div>

      {/* Search (filters pool by q) */}
      <form onSubmit={onSearch} className="mb-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-2.5 outline-none transition-all focus:border-[var(--brand-500)]"
            placeholder={t("search_orders")}
          />
        </div>
      </form>

      {/* List */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 break-words">
          {error}
        </div>
      )}

      {currentList.loading && currentList.items.length === 0 ? (
        <div className="py-8 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("loading")}
        </div>
      ) : currentList.items.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          <PackageOpen className="h-8 w-8 mx-auto mb-2 opacity-70" />
          {t("no_orders")}
        </div>
      ) : (
        <div className="space-y-2">
          {currentList.items.map((o) => {
            const statusVal = o.currentStatus || o.orderStatus;
            const normalized = statusVal ? String(statusVal).toUpperCase() : "";
            const isMine = tab === "mine"; // show OTP on mine

            return (
              <Row
                key={o._id || o.orderNo}
                order={o}
                collapsedDefault={true}
                t={t}
                rightEl={
                  tab === "pool" ? (
                    <button
                      type="button"
                      onClick={() => { pendingOrderToClaim.current = o?.orderNo || null; setScannerKey(k=>k+1); setScanOpen(true); }}
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-white brand-gradient"
                      title={t("scan_to_claim")}
                    >
                      <QrCode className="h-4 w-4" />
                      {t("claim")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setOtpOrder(o); setOtpOpen(true); }}
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-white brand-gradient"
                      title={t("send_otp")}
                    >
                      <Send className="h-4 w-4" />
                      OTP
                    </button>
                  )
                }
              />
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => (tab === "pool" ? loadPool({ reset:false }) : loadMine({ reset:false }))}
            disabled={currentList.moreLoading}
            className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2"
          >
            {currentList.moreLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-2">{t("load_more") || "Load more"}</span>
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] rounded-xl px-5 py-3 shadow-lg text-white ${toast.type==="success" ? "brand-gradient" : "bg-rose-600"}`}>
          <div className="font-medium text-sm">{toast.msg}</div>
        </div>
      )}

      {/* Scanner overlay for claim */}
      <ScannerOverlay
        key={scannerKey}
        visible={scanOpen}
        onClose={async () => { await stopScanner(); setScanOpen(false); }}
        scannerDivId={scannerDivId}
        title={t("scan_to_claim")}
      />

      {/* OTP Modal (for items in MINE) */}
      <OtpModal
        open={otpOpen}
        orderNo={otpOrder?.orderNo}
        onClose={() => setOtpOpen(false)}
        onSubmit={async (code) => {
          // Hook up verify API later; for now, just close after "submit"
          try {
            // Optionally: await sendOrderOtp(otpOrder?.orderNo); // if you want to resend before verify
          } finally {
            setOtpOpen(false);
          }
        }}
      />
    </section>
  );
}
