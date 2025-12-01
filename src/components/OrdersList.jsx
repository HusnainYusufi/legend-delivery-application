// src/components/OrdersList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  X,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAssignedOrders,
  AUTH_BASE_URL,
  verifyOrderOtp,
  fetchMyInTransit,
  fetchMyDelivered,
} from "../lib/api.js";
import { getAuth } from "../lib/auth.js";
import StatusBadge from "./StatusBadge.jsx";
import OtpModal from "./OtpModal.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";

const safeText = (v, { fallback = "-" } = {}) => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try { const json = JSON.stringify(v); return json.length > 160 ? json.slice(0,157)+"…" : json; }
  catch { return fallback; }
};
const errorToString = (e) => {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (typeof e?.message === "string") return e.message;
  try { const json = JSON.stringify(e); return json.length > 300 ? json.slice(0,297)+"…" : json; }
  catch { return String(e); }
};
const norm = (s) => String(s || "").trim().toUpperCase();

function pkgStatusOf(order) {
  const s =
    order?.__pkg?.pkgStatus ||
    order?.driverView?.package?.status ||
    order?.currentStatus ||
    order?.orderStatus ||
    "";
  return String(s).toUpperCase();
}

function driverRefSearchOf(order) {
  return (
    order?.__pkg?.driverRefSearch ||
    order?.driverView?.driverRefSearch ||
    ""
  );
}

// NEW: OTP/package key used in SMS/labels (e.g., "PK-9757E")
function pkgKeyOf(order) {
  return order?.__pkg?.pkgKey || order?.driverView?.pkgKey || "";
}

// NEW: single string that represents our OTP search identity
function otpSearchKeyOf(order) {
  return pkgKeyOf(order) || driverRefSearchOf(order) || "";
}

function CollapsibleCard({ order, children, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
  const statusVal = order.currentStatus || order.orderStatus;

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="w-full flex items-stretch justify-between px-3 py-2">
        <button onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <div className="overflow-x-auto no-scrollbar whitespace-nowrap pr-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {safeText(order.orderNo)}
            </span>

            <span className="inline-block align-middle ml-2">
              <StatusBadge value={statusVal} />
            </span>

            {/* NEW: prominent OTP/pkgKey pill visible even when collapsed */}
            {pkgKeyOf(order) && (
              <span
                className="ml-3 inline-flex items-center gap-1 text-[11px] px-2 py-[3px] rounded-full bg-indigo-600 text-white shadow-sm"
                title="OTP package key"
              >
                <span className="opacity-90">OTP</span>
                <span className="font-semibold">{pkgKeyOf(order)}</span>
              </span>
            )}

            {/* Keep the existing tiny ref chip (shown only if distinct from pkgKey) */}
            {driverRefSearchOf(order) && driverRefSearchOf(order) !== pkgKeyOf(order) && (
              <span className="ml-2 text-[11px] px-1.5 py-[1px] rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {driverRefSearchOf(order)}
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </article>
  );
}

export default function OrdersList({ showDeliveredOnly = false }) {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // my-in-transit default
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Driver sub-tab: 'undelivered' | 'delivered'
  const [subTab, setSubTab] = useState("undelivered");

  // Search query (driverRefSearch / pkgKey), debounce
  const [q, setQ] = useState("");
  const [qLive, setQLive] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setQ(qLive), 200);
    return () => clearTimeout(id);
  }, [qLive]);

  // OTP modal
  const [otpOrder, setOtpOrder] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  // Delivery celebration
  const [deliveredMsg, setDeliveredMsg] = useState("");

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const auth = getAuth();
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";

  const hasMore = orders.length < count;

  const driverLoad = async ({ reset }) => {
    const res = await fetchMyInTransit({
      page: reset ? 1 : page,
      limit,
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
  };

  const driverDeliveredLoad = async ({ reset }) => {
    const res = await fetchMyDelivered({
      page: reset ? 1 : page,
      limit,
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
  };

  const staffLoad = async ({ reset }) => {
    const res = await fetchAssignedOrders({
      page: reset ? 1 : page,
      limit: 15,
      sortBy: "orderDate",
      sortDir: "desc",
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
  };

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) setLoading(true);
      else setLoadingMore(true);

      if (isDriver) {
        if (showDeliveredOnly) await driverDeliveredLoad({ reset });
        else await driverLoad({ reset });
      } else await staffLoad({ reset });
    } catch (e) {
      console.error("Orders load error:", e);
      setError(`${errorToString(e)} [AUTH_BASE=${AUTH_BASE_URL}]`);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDriver, showDeliveredOnly]);

  // --- DRIVER VIEW PROCESSING ---

  // Filter by pkgKey OR driverRefSearch OR orderNo (after normalizing)
  const filteredByQuery = useMemo(() => {
    if (!isDriver) return orders;
    const query = norm(q);
    if (!query) return orders;

    return orders.filter((o) => {
      const a = norm(pkgKeyOf(o));            // e.g., "PK-9757E"
      const b = norm(driverRefSearchOf(o));   // e.g., "PK-9757E" or similar
      const c = norm(o.orderNo);              // optional convenience
      return a.includes(query) || b.includes(query) || c.includes(query);
    });
  }, [orders, q, isDriver]);

  // Split lists for driver view based on package status *after filtering*
  const driverUndelivered = useMemo(
    () => filteredByQuery.filter((o) => pkgStatusOf(o) === "IN_TRANSIT"),
    [filteredByQuery]
  );
  const driverDelivered = useMemo(
    () => filteredByQuery.filter((o) => pkgStatusOf(o) === "DELIVERED"),
    [filteredByQuery]
  );

  const shownOrders = isDriver
    ? showDeliveredOnly
      ? filteredByQuery
      : subTab === "delivered"
        ? driverDelivered
        : driverUndelivered
    : orders;

  const onVerifyOtp = async (code) => {
    if (!otpOrder?.orderNo) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      await verifyOrderOtp(otpOrder.orderNo, code);
      setOtpOpen(false);
      setDeliveredMsg("OTP verified. Order delivered ✅");
      setTimeout(() => setDeliveredMsg(""), 1500);
      await load({ reset: true });
    } catch (e) {
      setOtpError(errorToString(e));
    } finally {
      setOtpLoading(false);
    }
  };

  const MineList = useMemo(() => {
    if (shownOrders.length === 0) return null;

    return (
      <div className="space-y-2">
        {shownOrders.map((o) => {
          const pStatus = pkgStatusOf(o);
          const canVerify = pStatus === "IN_TRANSIT";

          return (
            <CollapsibleCard key={(o._id || o.orderNo) + ":" + (o.__pkg?.id || "")} order={o}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-slate-500 dark:text-slate-400">Search Ref</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {driverRefSearchOf(o) || "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-slate-500 dark:text-slate-400">Customer</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {safeText(o.customerName)}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-slate-500 dark:text-slate-400">City</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {safeText(o.city)}{o.country ? `, ${safeText(o.country)}` : ""}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-slate-500 dark:text-slate-400">Order Date</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {o.orderDate ? new Date(o.orderDate).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="text-slate-500 dark:text-slate-400">Tracking #</div>
                  <div className="font-medium text-slate-800 dark:text-slate-100 break-all">
                    {safeText(o.trackingNumber)}
                  </div>
                </div>

                {o?.driverView?.package && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 sm:col-span-2">
                    <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                      Package {o.driverView.package.number} / {o.driverView.package.of} — Status: {o.driverView.package.status}
                    </div>
                    {Array.isArray(o.driverView.items) && o.driverView.items.length > 0 && (
                      <ul className="list-disc pl-5 space-y-1">
                        {o.driverView.items.slice(0, 6).map((it, idx) => (
                          <li key={idx} className="text-sm text-slate-700 dark:text-slate-200">
                            {safeText(it.name || it.sku)} × {safeText(it.qty ?? 1)}
                          </li>
                        ))}
                        {o.driverView.items.length > 6 && (
                          <li className="text-xs text-slate-500 dark:text-slate-400">
                            +{o.driverView.items.length - 6} more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => { setDetailsOrder(o); setDetailsOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600"
                  title="Details"
                >
                  <Info className="h-4 w-4" />
                  Details
                </button>

                {canVerify && (
                  <button
                    onClick={() => { setOtpOrder(o); setOtpOpen(true); setOtpError(""); }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white brand-gradient"
                    title="Verify OTP"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify OTP
                  </button>
                )}
              </div>
            </CollapsibleCard>
          );
        })}
      </div>
    );
  }, [shownOrders]);

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {isDriver
            ? showDeliveredOnly
              ? t("delivered_title") || t("delivered_nav")
              : "My Orders"
            : t("orders_title")}
        </h2>

        {/* Driver-only search box now matches PK key, driverRefSearch, or orderNo */}
        {isDriver && (
          <div className="w-full md:w-auto md:min-w-[360px]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                inputMode="search"
                placeholder="Search by OTP key (e.g., PK-9757E) or code"
                value={qLive}
                onChange={(e) => setQLive(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {qLive && (
                <button
                  onClick={() => { setQLive(""); setQ(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                  title="Clear"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Tip: paste the <code>PK-XXXXX</code> OTP key or the label code from the SMS/label
            </div>
          </div>
        )}

        <button
          onClick={() => load({ reset: true })}
          disabled={loading}
          className="btn shrink-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </button>
      </div>

      {/* Driver sub-tabs */}
      {isDriver && !showDeliveredOnly && (
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setSubTab("undelivered")}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              subTab === "undelivered"
                ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700"
            }`}
          >
            Undelivered
            <span className="ml-2 inline-flex items-center justify-center text-[11px] px-1.5 py-[1px] rounded bg-black/10">
              {driverUndelivered.length}
            </span>
          </button>
          <button
            onClick={() => setSubTab("delivered")}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              subTab === "delivered"
                ? "border-blue-500 text-blue-700 bg-blue-50"
                : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700"
            }`}
          >
            Delivered
            <span className="ml-2 inline-flex items-center justify-center text-[11px] px-1.5 py-[1px] rounded bg-black/10">
              {driverDelivered.length}
            </span>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 break-words">
          {error}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="py-8 flex items-center justify-center text-slate-500 dark:text-slate-400 min-h-[30vh]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("loading")}
        </div>
      ) : shownOrders.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400 min-h-[30vh]">
          {q ? "No orders match your search." : "No orders"}
        </div>
      ) : isDriver ? (
        MineList
      ) : (
        // Staff view (non-driver)
        <div className="space-y-3">
          {shownOrders.map((o) => {
            const statusVal = o.currentStatus || o.orderStatus;
            return (
              <article
                key={o._id || o.orderNo}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-500 dark:text-slate-400">{t("order")}</div>
                    <div className="text-base font-semibold text-slate-800 dark:text-white break-all">
                      {safeText(o.orderNo)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={statusVal} />
                    <button
                      onClick={() => { setDetailsOrder(o); setDetailsOpen(true); }}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600"
                      title="Details"
                    >
                      <Info className="h-4 w-4" />
                      Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => load({ reset: false })}
            disabled={loadingMore}
            className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-4 py-2"
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="ml-2">{t("load_more") || "Load more"}</span>
          </button>
        </div>
      )}

      {/* OTP Modal (verify only) */}
      <OtpModal
        open={otpOpen}
        orderNo={otpOrder?.orderNo}
        loading={otpLoading}
        error={otpError}
        onClose={() => setOtpOpen(false)}
        onSubmit={onVerifyOtp}
      />

      {/* Details Modal */}
      <OrderDetailsModal
        open={detailsOpen}
        order={detailsOrder}
        onClose={() => setDetailsOpen(false)}
      />

      {/* Delivered celebration (simple) */}
      {deliveredMsg && (
        <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-8 py-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {deliveredMsg}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
