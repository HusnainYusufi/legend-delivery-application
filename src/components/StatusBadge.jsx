import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (!value) return null;
  const normalized = String(value).toLowerCase();
  const styles = {
    delivered: "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
    shipped: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
    processing: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    pending: "bg-gradient-to-r from-slate-500 to-slate-600 text-white",
    cancelled: "bg-gradient-to-r from-red-500 to-rose-600 text-white",
    returned: "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white",
    packed: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white",
    out_for_delivery: "bg-gradient-to-r from-teal-500 to-cyan-600 text-white",
  };
  const cls = styles[normalized] || "bg-gradient-to-r from-slate-500 to-slate-600 text-white";
  return (
    <span className={`badge px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 ${cls}`}>
      <CheckCircle2 className="h-4 w-4" />
      {t(`statuses.${normalized}`)}
    </span>
  );
}