// src/components/OrdersList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  RefreshCcw, Loader2, Info, CheckCircle2, X, Search, AlertTriangle, ChevronDown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  fetchAssignedOrders, AUTH_BASE_URL, verifyOrderOtp,
  fetchMyInTransit, fetchMyDelivered, setDeliveryNote,
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
  const s = order?.__pkg?.pkgStatus || order?.driverView?.package?.status || order?.currentStatus || order?.orderStatus || "";
  return String(s).toUpperCase();
}
function driverRefSearchOf(order) {
  return order?.__pkg?.driverRefSearch || order?.driverView?.driverRefSearch || "";
}
function pkgKeyOf(order) {
  return order?.__pkg?.pkgKey || order?.driverView?.pkgKey || "";
}
function otpSearchKeyOf(order) {
  return pkgKeyOf(order) || driverRefSearchOf(order) || "";
}

export default function OrdersList({ showDeliveredOnly = false }) {
  const { t } = useTranslation();
  const listRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [count, setCount] = useState(0);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [subTab, setSubTab] = useState("undelivered");
  const [q, setQ] = useState("");
  const [qLive, setQLive] = useState("");
  useEffect(() => { const id = setTimeout(() => setQ(qLive), 200); return () => clearTimeout(id); }, [qLive]);

  const [otpOrder, setOtpOrder] = useState(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [noteOrder, setNoteOrder] = useState(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");

  const DELIVERY_NOTES = [
    { value: "POSTPONED",    label: "Postponed",     description: "Customer requested later delivery" },
    { value: "NEEDS_ACTION", label: "Needs Action",  description: "Requires admin attention" },
    { value: "NOT_AVAILABLE",label: "Not Available", description: "Customer not reachable" },
  ];

  const [deliveredMsg, setDeliveredMsg] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const auth = getAuth();
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";
  const hasMore = isDriver ? serverHasMore : orders.length < count;

  const driverLoad = async ({ reset }) => {
    const res = await fetchMyInTransit({ page: reset ? 1 : page, limit });
    setServerHasMore(res.hasMore ?? false);
    const next = Array.isArray(res.orders) ? res.orders : [];
    if (reset) { setOrders(next); setPage(2); } else { setOrders((prev) => [...prev, ...next]); setPage((p) => p + 1); }
  };

  const driverDeliveredLoad = async ({ reset }) => {
    const res = await fetchMyDelivered({ page: reset ? 1 : page, limit });
    setServerHasMore(res.hasMore ?? false);
    setCount(res.total || 0);
    const next = Array.isArray(res.orders) ? res.orders : [];
    if (reset) { setOrders(next); setPage(2); } else { setOrders((prev) => [...prev, ...next]); setPage((p) => p + 1); }
  };

  const staffLoad = async ({ reset }) => {
    const res = await fetchAssignedOrders({ page: reset ? 1 : page, limit: 15, sortBy: "orderDate", sortDir: "desc" });
    setCount(res.count || 0);
    const next = Array.isArray(res.orders) ? res.orders : [];
    if (reset) { setOrders(next); setPage(2); } else { setOrders((prev) => [...prev, ...next]); setPage((p) => p + 1); }
  };

  const load = async ({ reset = false } = {}) => {
    try {
      setError("");
      if (reset) { setLoading(true); setServerHasMore(false); } else setLoadingMore(true);
      if (isDriver) {
        if (showDeliveredOnly || subTab === "delivered") await driverDeliveredLoad({ reset });
        else await driverLoad({ reset });
      } else await staffLoad({ reset });
    } catch (e) {
      setError(`${errorToString(e)} [AUTH_BASE=${AUTH_BASE_URL}]`);
    } finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { load({ reset: true }); }, [isDriver, showDeliveredOnly, subTab]); // eslint-disable-line

  const filteredByQuery = useMemo(() => {
    if (!isDriver) return orders;
    const query = norm(q);
    if (!query) return orders;
    return orders.filter((o) => {
      const a = norm(pkgKeyOf(o));
      const b = norm(driverRefSearchOf(o));
      const c = norm(o.orderNo);
      return a.includes(query) || b.includes(query) || c.includes(query);
    });
  }, [orders, q, isDriver]);

  const driverUndelivered = useMemo(
    () => filteredByQuery.filter((o) => { const s = pkgStatusOf(o); return s === "IN_TRANSIT" || s === "OUT_FOR_DELIVERY"; }),
    [filteredByQuery]
  );
  const driverDelivered = useMemo(() => filteredByQuery.filter((o) => pkgStatusOf(o) === "DELIVERED"), [filteredByQuery]);

  const shownOrders = isDriver
    ? showDeliveredOnly ? filteredByQuery
      : subTab === "delivered" ? driverDelivered
      : driverUndelivered
    : orders;

  /* Animate cards in when list changes */
  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll("article");
    if (!cards.length) return;
    gsap.fromTo(cards,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power3.out", clearProps: "transform" }
    );
  }, [shownOrders]);

  const onVerifyOtp = async (code) => {
    if (!otpOrder?.orderNo) return;
    setOtpLoading(true); setOtpError("");
    try {
      await verifyOrderOtp(otpOrder.orderNo, code, pkgKeyOf(otpOrder));
      setOtpOpen(false);
      setDeliveredMsg("OTP verified. Order delivered ✅");
      setTimeout(() => setDeliveredMsg(""), 2000);
      await load({ reset: true });
    } catch (e) { setOtpError(errorToString(e)); }
    finally { setOtpLoading(false); }
  };

  const onSubmitDeliveryNote = async (note) => {
    if (!noteOrder?.orderNo) return;
    setNoteLoading(true); setNoteError("");
    try {
      await setDeliveryNote(noteOrder.orderNo, note);
      setNoteOpen(false);
      setNoteSuccess(`Note set: ${DELIVERY_NOTES.find((n) => n.value === note)?.label || note}`);
      setTimeout(() => setNoteSuccess(""), 2000);
      await load({ reset: true });
    } catch (e) { setNoteError(errorToString(e)); }
    finally { setNoteLoading(false); }
  };

  const pageTitle = isDriver
    ? showDeliveredOnly ? (t("delivered_title") || t("delivered_nav")) : (t("orders_title") || "My Orders")
    : (t("orders_title") || "Assigned Orders");

  return (
    <section className="view-animate">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#DDDDDD] bg-white">
        <h2 className="text-[17px] font-bold text-[#222222]">{pageTitle}</h2>
        <button
          onClick={() => load({ reset: true })}
          disabled={loading}
          className="p-2 text-[#717171] rounded-full hover:bg-[#F7F7F7]"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
        </button>
      </div>

      {/* Driver sub-tabs */}
      {isDriver && !showDeliveredOnly && (
        <div className="pill-tabs pt-4">
          <button
            className={`pill-tab${subTab === "undelivered" ? " active" : ""}`}
            onClick={() => setSubTab("undelivered")}
          >
            Active
            <span className="ms-1.5 text-[11px] opacity-70">({driverUndelivered.length})</span>
          </button>
          <button
            className={`pill-tab${subTab === "delivered" ? " active" : ""}`}
            onClick={() => setSubTab("delivered")}
          >
            Delivered
            <span className="ms-1.5 text-[11px] opacity-70">({driverDelivered.length})</span>
          </button>
        </div>
      )}

      {/* Search bar */}
      {isDriver && (
        <div className="search-bar">
          <Search size={16} className="text-[#717171] flex-shrink-0" />
          <input
            type="text"
            inputMode="search"
            placeholder="Search by OTP key or order no."
            value={qLive}
            onChange={(e) => setQLive(e.target.value)}
          />
          {qLive && (
            <button onClick={() => { setQLive(""); setQ(""); }} className="text-[#717171]">
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="mx-4 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 break-words">
          {error}
        </div>
      )}

      {/* Order list */}
      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#717171]">
          <Loader2 size={28} className="animate-spin mb-3 text-[#FF385C]" />
          <span className="text-sm">{t("loading")}</span>
        </div>
      ) : shownOrders.length === 0 ? (
        <div className="py-20 text-center text-[#717171] text-sm">
          {q ? "No orders match your search." : t("no_orders") || "No orders"}
        </div>
      ) : isDriver ? (
        <div ref={listRef} className="px-4 pt-2 space-y-3">
          {shownOrders.map((o) => {
            const pStatus = pkgStatusOf(o);
            const canVerify = pStatus === "IN_TRANSIT" || pStatus === "OUT_FOR_DELIVERY";
            const key = pkgKeyOf(o);
            const dateStr = o.orderDate ? new Date(o.orderDate).toLocaleDateString() : "";

            return (
              <article key={(o._id || o.orderNo) + ":" + (o.__pkg?.id || "")} className="card overflow-hidden">
                <div className="p-4">
                  {/* Top row: status + date */}
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge value={pStatus || o.currentStatus} />
                    {dateStr && <span className="text-xs text-[#717171]">{dateStr}</span>}
                  </div>

                  {/* Order # */}
                  <div className="text-[16px] font-bold text-[#222222] mb-0.5 break-all">
                    {safeText(o.orderNo)}
                  </div>

                  {/* Customer + city */}
                  {o.customerName && (
                    <div className="text-sm text-[#717171]">{safeText(o.customerName)}</div>
                  )}
                  {o.city && (
                    <div className="text-sm text-[#717171]">{safeText(o.city)}</div>
                  )}

                  {/* OTP key badge */}
                  {key && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[rgba(255,56,92,0.08)] text-[#FF385C] font-semibold">
                        OTP: {key}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider + actions */}
                <div className="border-t border-[#DDDDDD] px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => { setDetailsOrder(o); setDetailsOpen(true); }}
                    className="text-sm font-semibold text-[#222222] underline underline-offset-2"
                  >
                    Details
                  </button>

                  {canVerify && (
                    <>
                      <button
                        onClick={() => { setOtpOrder(o); setOtpOpen(true); setOtpError(""); }}
                        className="btn-primary btn text-sm px-4 py-2 ms-auto"
                      >
                        <CheckCircle2 size={15} />
                        Verify OTP
                      </button>
                      <button
                        onClick={() => { setNoteOrder(o); setNoteOpen(true); setNoteError(""); }}
                        className="btn-outline-red btn text-sm px-3 py-2"
                      >
                        <AlertTriangle size={15} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        // Staff view
        <div ref={listRef} className="px-4 pt-2 space-y-3">
          {shownOrders.map((o) => {
            const statusVal = o.currentStatus || o.orderStatus;
            return (
              <article key={o._id || o.orderNo} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <StatusBadge value={statusVal} />
                    <div className="text-[16px] font-bold text-[#222222] mt-1.5 break-all">
                      {safeText(o.orderNo)}
                    </div>
                    {o.customerName && <div className="text-sm text-[#717171] mt-0.5">{safeText(o.customerName)}</div>}
                    {o.city && <div className="text-sm text-[#717171]">{safeText(o.city)}</div>}
                  </div>
                  <button
                    onClick={() => { setDetailsOrder(o); setDetailsOpen(true); }}
                    className="flex-shrink-0 text-sm font-semibold text-[#222222] underline underline-offset-2 mt-1"
                  >
                    Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-4 mb-2">
          <button
            onClick={() => load({ reset: false })}
            disabled={loadingMore}
            className="btn-outline btn px-6 py-2.5 text-sm"
          >
            {loadingMore ? <Loader2 size={16} className="animate-spin" /> : <ChevronDown size={16} />}
            <span className="ms-1">{t("load_more")}</span>
          </button>
        </div>
      )}

      {/* OTP Modal */}
      <OtpModal
        open={otpOpen}
        orderNo={otpOrder?.orderNo}
        loading={otpLoading}
        error={otpError}
        onClose={() => setOtpOpen(false)}
        onSubmit={onVerifyOtp}
      />

      {/* Details Modal */}
      <OrderDetailsModal open={detailsOpen} order={detailsOrder} onClose={() => setDetailsOpen(false)} />

      {/* Delivery Note Sheet */}
      {noteOpen && (
        <div className="fixed inset-0 z-[120] bg-black/50 modal-backdrop flex items-end justify-center">
          <div className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl sheet-animate">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#DDDDDD] rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#DDDDDD]">
              <div className="font-semibold text-[#222222] flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Can't Deliver
              </div>
              <button onClick={() => setNoteOpen(false)} className="p-1.5 text-[#717171] rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="px-5 pt-4 pb-8">
              <p className="text-sm text-[#717171] mb-1">Order</p>
              <p className="font-semibold text-[#222222] mb-4">{noteOrder?.orderNo}</p>

              {noteError && (
                <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{noteError}</div>
              )}

              <div className="space-y-2.5">
                {DELIVERY_NOTES.map((note) => (
                  <button
                    key={note.value}
                    onClick={() => onSubmitDeliveryNote(note.value)}
                    disabled={noteLoading}
                    className="w-full p-4 rounded-xl border border-[#DDDDDD] bg-[#F7F7F7] hover:bg-[#EEEEEE] text-left transition-colors disabled:opacity-50"
                  >
                    <div className="font-semibold text-[#222222] text-sm">{note.label}</div>
                    <div className="text-xs text-[#717171] mt-0.5">{note.description}</div>
                  </button>
                ))}
              </div>

              {noteLoading && (
                <div className="mt-4 flex items-center justify-center text-[#717171] gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Submitting…</span>
                </div>
              )}

              <button
                onClick={() => setNoteOpen(false)}
                className="btn-outline btn w-full mt-4"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery success */}
      {deliveredMsg && (
        <div className="fixed inset-0 z-[150] bg-black/60 flex items-center justify-center p-6 modal-backdrop">
          <div className="card p-8 text-center max-w-xs w-full modal-panel">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <div className="text-[17px] font-bold text-[#222222]">{deliveredMsg}</div>
          </div>
        </div>
      )}

      {/* Note success */}
      {noteSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] rounded-full px-5 py-3 shadow-lg text-white text-sm font-semibold flex items-center gap-2 bg-amber-500">
          <AlertTriangle size={16} />
          {noteSuccess}
        </div>
      )}
    </section>
  );
}
