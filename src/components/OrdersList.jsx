// src/components/OrdersList.jsx
import React, { useEffect, useState } from "react";
import { RefreshCcw, Loader2, PackageOpen, ChevronDown, Send, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAssignedOrders,
  AUTH_BASE_URL,
  sendOrderOtp,
} from "../lib/api.js";
import { getAuth } from "../lib/auth.js";
import StatusBadge from "./StatusBadge.jsx";
import OtpModal from "./OtpModal.jsx";
import OrderDetailsModal from "./OrderDetailsModal.jsx";

// ✅ driver UI
import PickupPool from "./PickupPool.jsx";

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

export default function OrdersList() {
  const { t } = useTranslation();

  // Figure out role
  const auth = getAuth();
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";

  // ✅ If driver, render the Claim UI (Pool/Mine tabs + scanner)
  if (isDriver) {
    return <PickupPool />;
  }

  // ---------- Staff list (kept as-is) ----------
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // OTP modal
  const [otpOrder, setOtpOrder] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const hasMore = orders.length < count;

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
      setSuccess("");
      if (reset) setLoading(true);
      else setLoadingMore(true);

      await staffLoad({ reset });
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
  }, []);

  const onSendOtp = async (order) => {
    setError("");
    setSuccess("");
    try {
      await sendOrderOtp(order.orderNo);
      setSuccess(t("otp_sent") || "OTP has been sent.");
      setOtpOrder(order);
      setOtpOpen(true);
    } catch (e) {
      setError(errorToString(e));
    }
  };

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t("orders_title")}
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

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200">
          {success}
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="py-8 flex items-center justify-center text-slate-500 dark:text-slate-400 min-h-[30vh]">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("loading")}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center text-slate-500 dark:text-slate-400 min-h-[30vh]">
          <PackageOpen className="h-8 w-8 mx-auto mb-2 opacity-70" />
          {t("no_orders")}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const statusVal = o.currentStatus || o.orderStatus;
            const normalized = statusVal ? String(statusVal).toUpperCase() : "";
            const showOtp = normalized === "IN_TRANSIT";

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
                    {showOtp && (
                      <button
                        onClick={() => onSendOtp(o)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white brand-gradient hover:opacity-95"
                        title={t("send_otp")}
                      >
                        <Send className="h-4 w-4" />
                        {t("send_otp")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-slate-500 dark:text-slate-400">{t("customer")}</div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {safeText(o.customerName)}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-slate-500 dark:text-slate-400">{t("city")}</div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {safeText(o.city)}{o.country ? `, ${safeText(o.country)}` : ""}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-slate-500 dark:text-slate-400">{t("order_date")}</div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {o.orderDate ? new Date(o.orderDate).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                    <div className="text-slate-500 dark:text-slate-400">{t("tracking_number")}</div>
                    <div className="font-medium text-slate-800 dark:text-slate-100 break-all">
                      {safeText(o.trackingNumber)}
                    </div>
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
            <span className="ml-2">{t("load_more")}</span>
          </button>
        </div>
      )}

      <OtpModal
        open={otpOpen}
        orderNo={otpOrder?.orderNo}
        onClose={() => setOtpOpen(false)}
        onSubmit={(code) => { setOtpOpen(false); }}
      />

      <OrderDetailsModal
        open={detailsOpen}
        order={detailsOrder}
        onClose={() => setDetailsOpen(false)}
      />
    </section>
  );
}
