import React from "react";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const { t } = useTranslation();
  return (
    <div className="splash">
      <div className="flex flex-col items-center w-[86%] max-w-md">
        {/* Animated logo */}
        <div className="splash-logo-wrap">
          <img
            src="/sh-logo.png"
            alt={t("brand")}
            className="splash-logo-anim"
          />
        </div>

        {/* Brand & tagline */}
        <div className="splash-brand">{t("brand")}</div>
        <div className="splash-tagline">{t("splash_tagline")}</div>
      </div>
    </div>
  );
}
