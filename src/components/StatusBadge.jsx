import React from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function StatusBadge({ value }) {
  const { t } = useTranslation();
  if (value == null) return null;

  const isString = typeof value === "string";
  const normalized = isString ? value.toUpperCase() : "";

  // Try translation first, fallback to a readable label
  const translated = isString ? t(`statuses.${normalized}`, { defaultValue: null }) : null;
  const label =
    translated ||
    (isString ? normalized.replace(/_/g, " ") : "—");

  return (
    <span className="badge-brand px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </span>
  );
}
