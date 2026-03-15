import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { X, MapPin, Calendar, Hash, User } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";

const safe = (v, fb = "-") => (v === null || v === undefined ? fb : String(v));

export default function OrderDetailsModal({ open, onClose, order }) {
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (open && sheetRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(sheetRef.current, { y: "100%" }, { y: "0%", duration: 0.38, ease: "power3.out" });
    }
  }, [open]);

  const handleClose = () => {
    if (sheetRef.current && backdropRef.current) {
      gsap.to(sheetRef.current, { y: "100%", duration: 0.28, ease: "power2.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.25, onComplete: onClose });
    } else {
      onClose?.();
    }
  };

  if (!open || !order) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-[120] bg-black/50 modal-backdrop flex items-end justify-center">
      <div ref={sheetRef} className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#DDDDDD] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#DDDDDD]">
          <div className="font-semibold text-[#222222]">Order Details</div>
          <button onClick={handleClose} className="p-1.5 text-[#717171] rounded-full" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto">
          {/* Order # + status */}
          <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-[#DDDDDD]">
            <div>
              <div className="text-xs text-[#717171] mb-0.5">Order</div>
              <div className="text-lg font-bold text-[#222222] break-all">{safe(order.orderNo)}</div>
            </div>
            <StatusBadge value={order.currentStatus || order.orderStatus} />
          </div>

          {/* Info grid */}
          <div className="px-5 py-4 space-y-3">
            {[
              { icon: User,     label: "Customer",    value: safe(order.customerName) },
              { icon: MapPin,   label: "City",        value: safe(order.city) + (order.country ? `, ${order.country}` : "") },
              { icon: Calendar, label: "Order Date",  value: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "-" },
              { icon: Hash,     label: "Tracking #",  value: safe(order.trackingNumber) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 bg-[#F7F7F7]">
                  <Icon size={15} className="text-[#717171]" />
                </div>
                <div>
                  <div className="text-xs text-[#717171]">{label}</div>
                  <div className="text-sm font-medium text-[#222222] break-words">{value}</div>
                </div>
              </div>
            ))}

            {order.customerAddress && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 bg-[#F7F7F7]">
                  <MapPin size={15} className="text-[#717171]" />
                </div>
                <div>
                  <div className="text-xs text-[#717171]">Address</div>
                  <div className="text-sm font-medium text-[#222222] break-words">{safe(order.customerAddress)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="mx-5 mb-4 rounded-xl bg-[#F7F7F7] p-4">
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-2">Items</div>
              <ul className="space-y-1.5">
                {order.items.map((it, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm text-[#222222]">
                    <span>{safe(it.productName || it.sku)}</span>
                    <span className="font-semibold">×{safe(it.quantity ?? 1)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status history */}
          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
            <div className="mx-5 mb-6 rounded-xl bg-[#F7F7F7] p-4">
              <div className="text-xs font-semibold text-[#717171] uppercase tracking-wide mb-3">Status History</div>
              <div className="space-y-2.5">
                {order.statusHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF385C] flex-shrink-0" />
                    <span className="text-sm font-medium text-[#222222]">{safe(h.status).replace(/_/g, " ")}</span>
                    <span className="text-xs text-[#717171] ms-auto">{h.at ? new Date(h.at).toLocaleDateString() : "-"}</span>
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
