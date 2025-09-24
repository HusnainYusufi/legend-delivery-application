import React from "react";
import { X } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const safe = (v, fb = "-") => (v === null || v === undefined ? fb : String(v));

export default function OrderDetailsModal({ open, onClose, order }) {
  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <img src="/sh-logo.png" alt="SHAHEENE" className="h-8 w-8 object-contain" />
            <div className="font-semibold text-slate-900 dark:text-slate-100">Order Details</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500">Order</div>
              <div className="text-lg font-semibold break-all">{safe(order.orderNo)}</div>
            </div>
            <StatusBadge value={order.currentStatus || order.orderStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-500">Customer</div>
              <div className="font-medium">{safe(order.customerName)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-500">City</div>
              <div className="font-medium">
                {safe(order.city)}{order.country ? `, ${safe(order.country)}` : ""}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-500">Order Date</div>
              <div className="font-medium">
                {order.orderDate ? new Date(order.orderDate).toLocaleString() : "-"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-xs text-slate-500">Tracking #</div>
              <div className="font-medium break-all">{safe(order.trackingNumber)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 p-3 md:col-span-2">
              <div className="text-xs text-slate-500">Address</div>
              <div className="font-medium break-words">{safe(order.customerAddress)}</div>
            </div>
          </div>

          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-sm text-slate-500 mb-2">Items</div>
              <ul className="list-disc pl-5 space-y-1">
                {order.items.map((it, idx) => (
                  <li key={idx} className="text-sm">
                    {safe(it.productName || it.sku)} × {safe(it.quantity ?? 1)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <div className="text-sm text-slate-500 mb-2">Status History</div>
              <div className="space-y-2">
                {order.statusHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="text-sm flex items-center gap-3">
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700">
                      {safe(h.status)}
                    </span>
                    <span className="text-slate-500">{h.at ? new Date(h.at).toLocaleString() : "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
