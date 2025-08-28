import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (value == null) return null;

  const isString = typeof value === "string";
  const normalized = isString ? value.toUpperCase() : "";

  // Keep semantic colors but with subtler, brand-friendly tones
  const statusStyles = {
    PENDING: "bg-slate-600",
    PREPARING: "bg-amber-600",
    PREPARED: "bg-cyan-700",
    AWAITING_PICKUP: "bg-teal-700",
    IN_TRANSIT: "bg-indigo-700",
    OUT_FOR_DELIVERY: "bg-yellow-600",
    DELIVERED: "bg-emerald-700",
    DELIVERY_FAILED: "bg-rose-700",
    ON_HOLD: "bg-slate-600",
    RETURNED: "bg-fuchsia-700",
    CANCELLED: "bg-rose-700",
  };

  const cls =
    (isString && statusStyles[normalized]) || "bg-[var(--brand-600)]";

  const translated =
    isString && t(`statuses.${normalized}`, { defaultValue: null });
  const label =
    translated ||
    (isString ? normalized.replace(/_/g, " ") : "—");

  return (
    <span className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 ${cls} text-white`}>
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </span>
  );
}
