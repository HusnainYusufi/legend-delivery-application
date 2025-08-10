import React from "react";
import { QrCode, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Header({ useMock, onToggleMock, language, onChangeLanguage }) {
  const { t } = useTranslation();
  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-brand-800">LEGEND DELIVERY</div>
          <div className="text-xs text-brand-700">QR Status</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-600">{t("language")}</label>
        <select
          className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm"
          value={language}
          onChange={(e) => onChangeLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
        <button
          onClick={onToggleMock}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm shadow-sm ${useMock ? "border-amber-300 bg-amber-50" : "border-slate-300 bg-white"}`}
          title="Toggle mock API"
        >
          <Settings className="h-4 w-4" />
          {useMock ? t("mock_api") : t("live_api")}
        </button>
      </div>
    </header>
  );
}
