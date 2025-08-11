import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (!value) return null;
  
  const statusStyles = {
    PENDING: "bg-gradient-to-r from-slate-500 to-slate-600",
    PREPARING: "bg-gradient-to-r from-amber-500 to-orange-500",
    PREPARED: "bg-gradient-to-r from-blue-500 to-indigo-500",
    AWAITING_PICKUP: "bg-gradient-to-r from-teal-500 to-cyan-600",
    IN_TRANSIT: "bg-gradient-to-r from-purple-500 to-fuchsia-600",
    OUT_FOR_DELIVERY: "bg-gradient-to-r from-yellow-500 to-orange-500",
    DELIVERED: "bg-gradient-to-r from-green-500 to-emerald-600",
    DELIVERY_FAILED: "bg-gradient-to-r from-red-500 to-rose-600",
    ON_HOLD: "bg-gradient-to-r from-slate-500 to-slate-600",
    RETURNED: "bg-gradient-to-r from-purple-500 to-fuchsia-600",
    CANCELLED: "bg-gradient-to-r from-red-500 to-rose-600",
  };
  
  const normalized = String(value).toUpperCase();
  const cls = statusStyles[normalized] || "bg-gradient-to-r from-slate-500 to-slate-600";
  
  return (
    <span className={`badge px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${cls} text-white`}>
      <CheckCircle2 className="h-4 w-4" />
      {t(`statuses.${normalized}`)}
    </span>
  );
}