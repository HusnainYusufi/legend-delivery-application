// src/components/StatusBadge.jsx
import React from "react";

const STATUS_MAP = {
  DELIVERED:         { bg: "#ECFDF5", text: "#065F46", dot: "#10B981", label: "Delivered" },
  IN_TRANSIT:        { bg: "#EFF6FF", text: "#1E40AF", dot: "#3B82F6", label: "In Transit" },
  OUT_FOR_DELIVERY:  { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B", label: "Out for Delivery" },
  PENDING:           { bg: "#F9FAFB", text: "#374151", dot: "#9CA3AF", label: "Pending" },
  AWAITING_PICKUP:   { bg: "#F5F3FF", text: "#5B21B6", dot: "#8B5CF6", label: "Awaiting Pickup" },
  DELIVERY_FAILED:   { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", label: "Failed" },
  RETURNED:          { bg: "#FDF4FF", text: "#6B21A8", dot: "#A855F7", label: "Returned" },
  CANCELLED:         { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444", label: "Cancelled" },
};

const DEFAULT = { bg: "#F9FAFB", text: "#374151", dot: "#9CA3AF" };

export default function StatusBadge({ value }) {
  const key = String(value || "").toUpperCase().replace(/\s+/g, "_");
  const s = STATUS_MAP[key] || DEFAULT;
  const label = s.label || key.replace(/_/g, " ");

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {label}
    </span>
  );
}
