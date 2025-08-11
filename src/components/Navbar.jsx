import React from "react";
import { QrCode, Camera, Image, Settings, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({
  language,
  onChangeLanguage,
  onScan,
  onPickImage,
  useMock,
  onToggleMock,
  darkMode,
  toggleDarkMode
}) {
  const { t } = useTranslation();
  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-md px-4">
      <div className="navbar-inner max-w-3xl mx-auto py-2 flex items-center justify-between">
        {/* Brand - Reduced size */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <QrCode className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">LEGEND DELIVERY</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">QR Status</div>
          </div>
        </div>

        {/* Actions - Better spacing */}
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleDarkMode}
            className="icon-btn bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-1.5"
            aria-label={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <select
            aria-label={t("language")}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 text-xs shadow-sm"
            value={language}
            onChange={(e) => onChangeLanguage?.(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          {/* Mock toggle - Smaller */}
          {onToggleMock && (
            <button
              type="button"
              onClick={onToggleMock}
              className={`hidden sm:inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs shadow-sm ${
                useMock 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" 
                  : "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
              }`}
              title={useMock ? t("mock_api") : t("live_api")}
            >
              <Settings className="h-3 w-3" />
              <span className="hidden md:inline text-xs">{useMock ? "Mock" : "Live"}</span>
            </button>
          )}

          {/* Scan buttons - Better alignment */}
          <button 
            type="button" 
            onClick={onScan} 
            className="icon-btn bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-1.5"
            aria-label={t("scan")}
          >
            <Camera className="h-4 w-4" />
          </button>
          <label 
            className="icon-btn bg-gradient-to-r from-slate-600 to-slate-700 text-white p-1.5 cursor-pointer" 
            aria-label="Scan Photo"
          >
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            <Image className="h-4 w-4" />
          </label>
        </div>
      </div>
    </nav>
  );
}