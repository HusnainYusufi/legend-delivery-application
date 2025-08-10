import React from "react";
import { QrCode, Camera, Image, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({
  language,
  onChangeLanguage,
  onScan,
  onPickImage,
  useMock,
  onToggleMock,
}) {
  const { t } = useTranslation();
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight text-brand-800">LEGEND DELIVERY</div>
            <div className="text-[11px] text-brand-700">QR Status</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <select
            aria-label={t("language")}
            className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-sm"
            value={language}
            onChange={(e) => onChangeLanguage?.(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          {/* Mock toggle (if you use it) */}
          {onToggleMock && (
            <button
              type="button"
              onClick={onToggleMock}
              className={`hidden sm:inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm ${
                useMock ? "border-amber-300 bg-amber-50" : "border-slate-300 bg-white"
              }`}
              title={useMock ? t("mock_api") : t("live_api")}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">{useMock ? t("mock_api") : t("live_api")}</span>
            </button>
          )}

          {/* Quick scan + photo */}
          <button type="button" onClick={onScan} className="icon-btn" aria-label={t("scan")}>
            <Camera className="h-5 w-5" />
          </button>
          <label className="icon-btn cursor-pointer" aria-label="Scan Photo">
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            <Image className="h-5 w-5" />
          </label>
        </div>
      </div>
    </nav>
  );
}
