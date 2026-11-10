// src/components/ScreenHeader.jsx
// Dark header used by the driver's inner screens: back arrow, the yellow S
// tile, "SHAHEEN DRIVER" and the screen title. `children` sit on the bottom
// edge and overlap the page (search bar, order card, rewards card).
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import iconUrl from "/shaheen-icon.png";

export default function ScreenHeader({ title, onBack, children }) {
  const { t } = useTranslation();
  return (
    <header className={`scr-hero${children ? " scr-hero--overlap" : ""}`}>
      <div className="scr-hero-row">
        {onBack && (
          <button type="button" onClick={onBack} className="scr-back" aria-label={t("back")}>
            <ArrowLeft size={22} className="rtl-flip" />
          </button>
        )}
        <img src={iconUrl} alt="SHAHEEN" className="scr-logo" />
        <div className="min-w-0">
          <p className="scr-kicker">{t("app_kicker")}</p>
          <h1 className="scr-title">{title}</h1>
        </div>
      </div>
      {children && <div className="scr-hero-overlap">{children}</div>}
    </header>
  );
}
