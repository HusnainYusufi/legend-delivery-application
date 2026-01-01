// src/components/Splash.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import logoUrl from "/sh-logo.png"; // resolves asset in Vite + Capacitor

export default function Splash() {
  const { t } = useTranslation();

  return (
    <div className="splash">
      {/* Full-screen animation stage so the logo can travel across the viewport */}
      <div className="splash-anim-stage" aria-hidden="true">
        <div className="splash-anim-track">
          <img
            src={logoUrl}
            alt={t("brand")}
            className="splash-logo-drive"
          />
        </div>
      </div>

      {/* Brand text (centered) */}
      <div className="flex flex-col items-center w-[86%] max-w-md relative z-[2] splash-content">
        <div className="splash-brand splash-brand-animate">{t("brand")}</div>
        <div className="splash-tagline splash-tagline-animate">{t("splash_tagline")}</div>
      </div>
    </div>
  );
}
