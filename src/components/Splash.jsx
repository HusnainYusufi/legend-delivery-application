import React from "react";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const { t } = useTranslation();
  return (
    <div className="splash">
      <div className="flex flex-col items-center w-[84%] max-w-md">
        {/* Logo tile */}
        <div className="splash-logo-tile">
          <img
            src="/sh-logo.png"
            alt={t("brand")}
            className="splash-logo-img"
          />
        </div>

        {/* Brand & tagline */}
        <div className="splash-brand">{t("brand")}</div>
        <div className="splash-tagline">{t("splash_tagline")}</div>

        {/* Road + moving truck (logo) */}
        <div className="w-full mt-8">
          <div className="road road-animate">
            <div className="road-centerline" />
            <img
              src="/sh-logo.png"
              alt="truck"
              className="truck-animate"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
