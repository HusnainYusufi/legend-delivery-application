import React from "react";
import { Menu, ListChecks } from "lucide-react";
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
    <nav className="navbar fixed top-0 left-0 right-0 z-50 px-4">
      <div className="navbar-inner max-w-3xl mx-auto py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="icon-btn p-2.5 rounded-lg border-white/20 bg-white/10 hover:bg-white/15 text-white"
            aria-label={t("menu")}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <img
                src="/sh-logo.png"
                alt="SHAHEENE"
                className="h-6 w-6 object-contain"
              />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white">
                {t("brand")}
              </div>
              <div className="text-[10px] text-white/80">QR Status</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <>
              <div className="h-2 w-2 rounded-full bg-emerald-400" title="Authenticated"></div>
              <button
                onClick={onOrdersClick}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-white/20 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-white"
              >
                <ListChecks className="h-4 w-4" />
                {t("orders_nav")}
              </button>
            </>
          )}

          <select
            aria-label={t("language")}
            className="rounded-lg border border-white/20 bg-white/10 text-white px-2 py-1 text-xs shadow-sm"
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
