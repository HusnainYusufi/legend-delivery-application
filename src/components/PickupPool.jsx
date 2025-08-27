// src/components/PickupPool.jsx
import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";
import StatusBadge from "./StatusBadge.jsx";
import { fetchAwaitingPickupOrders, claimOrder } from "../lib/api.js";

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
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");

  const hasMore = orders.length < count;

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const res = await fetchAwaitingPickupOrders({
        page: reset ? 1 : page,
        limit,
        unassigned: true,
      });

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
      console.error("Pickup pool error:", e);
      setError(e?.message || "Failed to load pickup pool.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onQueryChange = useMemo(
    () =>
      debounce((val) => setQ(val.trim().toLowerCase()), 250),
    []
  );

  const filtered = useMemo(() => {
    if (!q) return orders;
    return orders.filter((o) => {
      const hay = [
        o.orderNo,
        o.trackingNumber,
        o.customerName,
        o.city,
        o.country,
        o.mobile,
        o.orderReference,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, q]);

  const [claimingIds, setClaimingIds] = useState({});
  const doClaim = async (orderId) => {
    setClaimingIds((s) => ({ ...s, [orderId]: true }));
    try {
      await claimOrder(orderId);
      setOrders((prev) => prev.filter((x) => x._id !== orderId));
      setCount((c) => Math.max(0, c - 1));
    } catch (e) {
      alert(e?.message || "Claim failed");
    } finally {
      setClaimingIds((s) => {
        const n = { ...s };
        delete n[orderId];
        return n;
      });
    }
  };

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t("pickup_pool_title")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("pickup_pool_sub")}
          </p>
        </div>
        <button
          onClick={() => load({ reset: true })}
          disabled={loading}
          className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-2"
          aria-label="Refresh"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
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
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400">
          <Truck className="h-8 w-8 mx-auto mb-2 opacity-70" />
          {q ? t("no_matches") : t("no_pool_orders")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
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
                  onClick={() => doClaim(o._id)}
                  disabled={!!claimingIds[o._id]}
                  className="btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {claimingIds[o._id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {t("claim")}
                </button>
              </div>
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
    </section>
  );
}
