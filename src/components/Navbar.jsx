// src/components/Navbar.jsx
import React from "react";
import { QrCode, Menu, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Navbar({
  language,
  onChangeLanguage,
  isAuthenticated,
  onMenuClick,
  onOrdersClick,
}) {
  const { t } = useTranslation();
  return (
    <nav className="navbar fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 shadow-md px-4">
      <div className="navbar-inner max-w-3xl mx-auto py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="icon-btn bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2.5 rounded-lg"
            aria-label={t("menu")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <QrCode className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">LEGEND DELIVERY</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">QR Status</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" title="Authenticated"></div>
              <button
                onClick={onOrdersClick}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <ListChecks className="h-4 w-4" />
                {t("orders_nav")}
              </button>
            </>
          )}

          <select
            aria-label={t("language")}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 text-xs shadow-sm"
            value={language}
            onChange={(e) => onChangeLanguage?.(e.target.value)}
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>
        </div>
      </div>
    </nav>
  );
}
