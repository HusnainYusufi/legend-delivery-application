import React from "react";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const { t } = useTranslation();
  return (
    <div className="splash fixed inset-0 z-50 flex items-center justify-center">
      <div className="splash-card flex flex-col items-center">
        <div className="splash-logo h-20 w-20 rounded-2xl bg-white flex items-center justify-center mb-6">
          <div className="brand-gradient w-14 h-14 rounded-xl flex items-center justify-center">
            <span className="text-white text-2xl font-black select-none">SH</span>
          </div>
        </div>
        <div className="text-2xl font-extrabold text-white">{t("brand")}</div>
        <div className="mt-1 text-sm text-blue-100">{t("splash_tagline")}</div>
        <div className="splash-bar w-48 h-1.5 bg-white/20 rounded-full mt-8 overflow-hidden">
          <div className="h-full w-1/3 bg-white animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
