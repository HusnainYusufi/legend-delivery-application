import React from "react";
import { useTranslation } from "react-i18next";

const STATUS_STYLES = {
  PENDING:          "bg-gray-100 text-gray-600",
  PREPARING:        "bg-amber-50 text-amber-700",
  PREPARED:         "bg-cyan-50 text-cyan-700",
  AWAITING_PICKUP:  "bg-teal-50 text-teal-700",
  IN_TRANSIT:       "bg-blue-50 text-blue-700",
  OUT_FOR_DELIVERY: "bg-yellow-50 text-yellow-700",
  DELIVERED:        "bg-green-50 text-green-700",
  DELIVERY_FAILED:  "bg-red-50 text-red-700",
  ON_HOLD:          "bg-gray-100 text-gray-600",
  RETURNED:         "bg-purple-50 text-purple-700",
  CANCELLED:        "bg-red-50 text-red-700",
};

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (value == null) return null;

  const normalized = typeof value === "string" ? value.toUpperCase() : "";
  const cls = STATUS_STYLES[normalized] || "bg-gray-100 text-gray-600";
  const translated = normalized && t(`statuses.${normalized}`, { defaultValue: null });
  const label = translated || (normalized ? normalized.replace(/_/g, " ") : "—");

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
