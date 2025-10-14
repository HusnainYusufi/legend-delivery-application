// src/components/OrdersList.jsx
import React, { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Loader2, ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAssignedOrders,
  fetchAwaitingPickupOrders,
  AUTH_BASE_URL,
  verifyOrderOtp,
  fetchMyInTransit,
} from "../lib/api.js";
import { getAuth } from "../lib/auth.js";
import StatusBadge from "./StatusBadge.jsx";
import OtpModal from "./OtpModal.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";

const safeText = (v, { fallback = "-" } = {}) => {
  if (v == null) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    const json = JSON.stringify(v);
    return json.length > 160 ? json.slice(0, 157) + "…" : json;
  } catch {
    return fallback;
  }
};
const errorToString = (e) => {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  if (typeof e?.message === "string") return e.message;
  try {
    const json = JSON.stringify(e);
    return json.length > 300 ? json.slice(0, 297) + "…" : json;
  } catch {
    return String(e);
  }
};

// Lightweight collapsible card used in Mine tab
function CollapsibleCard({ order, children, initiallyOpen = false }) {
  const [open, setOpen] = useState(initiallyOpen);
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
          <button
            onClick={() => setOpen(o => !o)}
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

export default function OrdersList() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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

  // Loader: staff vs driver
  const driverLoad = async ({ reset }) => {
    // Prefer the "my in-transit" endpoint for Mine list UX; fallback to awaiting-pickup?mine=true if needed.
    const res = await fetchMyInTransit({
      page: reset ? 1 : page,
      limit: 20,
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
      limit,
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

      if (isDriver) await driverLoad({ reset });
      else await staffLoad({ reset });
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
  }, [isDriver]);

  const onVerifyOtp = async (code) => {
    if (!otpOrder?.orderNo) return;
    setOtpLoading(true);
    setOtpError("");
    try {
      await verifyOrderOtp(otpOrder.orderNo, code);
      setOtpOpen(false);
      setDeliveredMsg("OTP verified. Order delivered ✅");
      setTimeout(() => setDeliveredMsg(""), 1500);
      // Reload to reflect delivered
      await load({ reset: true });
    } catch (e) {
      setOtpError(errorToString(e));
    } finally {
      setOtpLoading(false);
    }
  };

  const MineList = useMemo(() => {
    if (orders.length === 0) return null;

    return (
      <div className="space-y-2">
        {orders.map((o) => {
          const statusVal = o.currentStatus || o.orderStatus;
          const normalized = statusVal ? String(statusVal).toUpperCase() : "";
          const canVerify = normalized === "IN_TRANSIT"; // Only allow verify while in-transit

          return (
            <CollapsibleCard key={o._id || o.orderNo} order={o}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
                {Array.isArray(o.items) && o.items.length > 0 && (
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 sm:col-span-2">
                    <div className="text-slate-500 dark:text-slate-400 text-sm mb-1">Items</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {o.items.slice(0, 5).map((it, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-200">
                          {safeText(it.productName || it.sku)} × {safeText(it.quantity ?? 1)}
                        </li>
                      ))}
                      {o.items.length > 5 && (
                        <li className="text-xs text-slate-500 dark:text-slate-400">
                          +{o.items.length - 5} more
                        </li>
                      )}
                    </ul>
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
  }, [orders]);

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {isDriver ? "My Orders (In Transit)" : t("orders_title")}
        </h2>
        <button
          onClick={() => load({ reset: true })}
          disabled={loading}
          className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
        </button>
      </div>

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
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400 min-h-[30vh]">
          {/* icon purposely omitted to avoid React/DOM conflicts in some setups */}
          No orders
        </div>
      ) : isDriver ? (
        MineList
      ) : (
        // Staff view (non-driver): keep simple grid
        <div className="space-y-3">
          {orders.map((o) => {
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
            <div className="text-lg font-semibold text-slate-800 dark:text-slate-100">{deliveredMsg}</div>
          </div>
        </div>
      )}
    </section>
  );
}
