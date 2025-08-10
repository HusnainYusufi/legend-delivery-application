import React from "react";
import { useTranslation } from "react-i18next";

export default function Splash() {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-sky-100 to-sky-300">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-brand-600 shadow-lg flex items-center justify-center">
          <span className="text-white text-2xl font-black">LD</span>
        </div>
        <div className="text-2xl font-extrabold text-brand-800">LEGEND DELIVERY</div>
        <div className="mt-1 text-sm text-brand-700">{t("splash_tagline")}</div>
        <div className="mt-6 h-1.5 w-40 mx-auto rounded-full bg-white/60 overflow-hidden">
          <div className="h-full w-1/3 animate-[progress_1.1s_ease-in-out_infinite] bg-brand-600"></div>
        </div>
      </div>
      <style>{`@keyframes progress{0%{transform:translateX(-100%)}50%{transform:translateX(50%)}100%{transform:translateX(200%)}}`}</style>
    </div>
  );
}
