import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  const styles = {
    delivered: "bg-green-100 text-green-700 border-green-300",
    shipped: "bg-blue-100 text-blue-700 border-blue-300",
    processing: "bg-amber-100 text-amber-700 border-amber-300",
    pending: "bg-gray-100 text-gray-700 border-gray-300",
    cancelled: "bg-red-100 text-red-700 border-red-300",
    returned: "bg-purple-100 text-purple-700 border-purple-300",
    packed: "bg-indigo-100 text-indigo-700 border-indigo-300",
    out_for_delivery: "bg-teal-100 text-teal-700 border-teal-300",
  };
  const cls = styles[normalized] || "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span className={`badge ${cls}`}>
      <CheckCircle2 className="h-4 w-4" />
      {t(`statuses.${normalized}`)}
    </span>
  );
}
