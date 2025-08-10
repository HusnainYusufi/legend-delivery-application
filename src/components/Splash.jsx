import React from "react";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const { t } = useTranslation();
  return (
    <div className="splash">
      <div className="splash-card">
        <div className="splash-logo">
          <span className="text-white text-2xl font-black">LD</span>
        </div>
        <div className="text-2xl font-extrabold text-brand-800">LEGEND DELIVERY</div>
        <div className="mt-1 text-sm text-brand-700">{t("splash_tagline")}</div>
        <div className="splash-bar">
          <div className="h-full w-1/3 bg-brand-600"></div>
        </div>
      </div>
    </div>
  );
}
