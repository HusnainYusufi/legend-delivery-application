// src/components/PickupPool.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  RefreshCcw,
  Search,
  Package,
  MapPin,
  User as UserIcon,
  Boxes,
  Weight,
  Truck,
  Check,
  Camera,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import StatusBadge from "./StatusBadge.jsx";
import {
  fetchAwaitingPickupOrders,
  fetchAwaitingPickupMine,
  claimPickupByOrderNo,
  parseOrderNumberFromScan,
} from "../lib/api.js";
import ScannerOverlay from "./ScannerOverlay.jsx";
import {
  ensureCameraPermission,
  startWebQrScanner,
} from "../lib/scanner.js";

const safe = (v, fallback = "-") =>
  v == null ? fallback : typeof v === "string" || typeof v === "number" ? String(v) : fallback;

const debounce = (fn, ms = 300) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

export default function PickupPool() {
  const { t } = useTranslation();

  // tabs: "pool" (unassigned) | "mine"
  const [tab, setTab] = useState("pool");

  // list state
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // search
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const onQueryChange = useMemo(
    () => debounce((val) => setQ(val.trim()), 250),
    []
  );

  const hasMore = orders.length < count;

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const baseArgs = { page: reset ? 1 : page, limit, q };
      const res =
        tab === "pool"
          ? await fetchAwaitingPickupOrders({ ...baseArgs, unassigned: true })
          : await fetchAwaitingPickupMine({ ...baseArgs });

      setCount(res.count || 0);
      const next = Array.isArray(res.orders) ? res.orders : [];

      if (reset) {
        setOrders(next);
        setPage(2);
      } else {
        setOrders((prev) => [...prev, ...next]);
        setPage((p) => p + 1);
      }
    } catch (e) {
      console.error("Pickup list error:", e);
      setError(e?.message || "Failed to load.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

  // --------- SCAN TO CLAIM ---------
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const scannerRef = useRef(null);
  const scannerDivId = "pickup-qr-region";
  const [scannerKey, setScannerKey] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [banner, setBanner] = useState(null); // {type:'success'|'error', msg:string}

  const stopScanner = async () => {
    try {
      await scannerRef.current?.stop?.();
    } catch {}
    scannerRef.current = null;
  };

  const openScanner = async () => {
    setScanError("");
    await stopScanner();

    const perm = await ensureCameraPermission();
    if (!perm.granted) {
      setScanError(t("camera_permission_denied"));
      setScanOpen(true);
      return;
    }

    setScanOpen(true);
    setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            const orderNo = parseOrderNumberFromScan(decoded);
            if (!orderNo) {
              setScanError(t("scan_no_order"));
              return;
            }
            setClaiming(true);
            try {
              await claimPickupByOrderNo(orderNo);
              setBanner({ type: "success", msg: t("claim_success") });
              // remove from list if present
              setOrders((prev) => prev.filter((x) => x.orderNo !== orderNo));
              setCount((c) => (c > 0 ? c - 1 : 0));
            } catch (e) {
              setBanner({ type: "error", msg: e?.message || t("claim_failed") });
            } finally {
              setClaiming(false);
              await stopScanner();
              setScanOpen(false);
              setScannerKey((k) => k + 1);
              setTimeout(() => setBanner(null), 1500);
            }
          },
          (err) => {
            setScanError(err || t("camera_init_failed"));
          }
        );
        scannerRef.current = s;
      } catch {
        setScanError(t("camera_init_failed"));
      }
    }, 120);
  };

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t("pickup_pool_title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tab === "pool" ? t("pickup_pool_sub") : t("pickup_mine_sub")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "pool" && (
            <button
              onClick={openScanner}
              className="btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-2"
              title={t("scan_to_claim")}
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => load({ reset: true })}
            disabled={loading}
            className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-2"
            aria-label="Refresh"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            tab === "pool"
              ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          onClick={() => setTab("pool")}
        >
          {t("tab_pool")}
        </button>
        <button
          className={`flex-1 px-3 py-2 text-sm font-medium ${
            tab === "mine"
              ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
          onClick={() => setTab("mine")}
        >
          {t("tab_mine")}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white pl-9 pr-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
            placeholder={t("pickup_search_placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onQueryChange(e.target.value);
            }}
          />
        </div>
      </div>

      {/* Inline banner */}
      {banner && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            banner.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-800"
          }`}
        >
          {banner.msg}
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 break-words">
          {error}
        </div>
      )}

      {/* Empty/Loading */}
      {loading && orders.length === 0 ? (
        <div className="py-8 flex items-center justify-center text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("loading")}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          <Truck className="h-8 w-8 mx-auto mb-2 opacity-70" />
          {tab === "pool" ? t("no_pool_orders") : t("no_mine_orders")}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <article
              key={o._id}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {t("order")}
                  </div>
                  <div className="text-base font-semibold text-slate-800 dark:text-white break-all">
                    {safe(o.orderNo)}
                  </div>
                </div>
                <StatusBadge value={o.currentStatus || o.orderStatus || "AWAITING_PICKUP"} />
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <UserIcon className="h-4 w-4" />
                    {t("customer")}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {safe(o.customerName)}
                  </div>
                </div>

                <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    {t("city")}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {safe(o.city)}{o.country ? `, ${safe(o.country)}` : ""}
                  </div>
                </div>

                <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Boxes className="h-4 w-4" />
                    {t("boxes")}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {Array.isArray(o.boxes) ? o.boxes.length : 0}
                  </div>
                </div>

                <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Weight className="h-4 w-4" />
                    {t("weight")}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {o.totalWeight ?? 0}
                  </div>
                </div>

                {o.customerAddress && (
                  <div className="sm:col-span-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Package className="h-4 w-4" />
                      {t("address")}
                    </div>
                    <div className="font-medium text-slate-800 dark:text-slate-100 break-words">
                      {o.customerAddress}
                    </div>
                  </div>
                )}
              </div>

              {tab === "pool" && (
                <div className="mt-4 flex items-center justify-end gap-2">
                  {o.mobile && (
                    <a
                      href={`tel:${safe(o.mobile, "")}`}
                      className="btn bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <Truck className="h-4 w-4" />
                      {t("call_customer")}
                    </a>
                  )}

                  <button
                    onClick={openScanner}
                    className="btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4" />
                    {t("claim")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => load({ reset: false })}
            disabled={loadingMore}
            className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loadingMore ? t("loading") : t("load_more")}
          </button>
        </div>
      )}

      {/* Scanner overlay for claiming */}
      {scanOpen && (
        <div className="fixed inset-0 z-[200]">
          <ScannerOverlay
            key={scannerKey}
            visible={scanOpen}
            onClose={async () => {
              await stopScanner();
              setScanOpen(false);
              setScannerKey((k) => k + 1);
            }}
            scannerDivId={scannerDivId}
            title={t("scan_to_claim")}
          />
          {/* small error chip in corner */}
          {(scanError || claiming) && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 bg-black/70 text-white text-sm backdrop-blur">
              {claiming ? t("scanning_claiming") : scanError}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
