import React, { useEffect, useRef } from "react";
import { X, User, Lock, ListChecks, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { App as CapApp } from "@capacitor/app";

export default function Drawer({
  isOpen,
  onClose,
  isAuthenticated,
  isDriver = false,
  onLoginClick,
  onLogout,
  onOrdersClick,
  onPickupClick,
  language,
}) {
  const { t } = useTranslation();
  const isRTL = language === "ar";
  const overlayRef = useRef(null);

  // Lock body scroll, ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);

  // Android back button (Capacitor) — **await** the listener handle
  useEffect(() => {
    if (!isOpen) return;
    let handle = null;
    let alive = true;

    (async () => {
      try {
        const h = await CapApp.addListener("backButton", () => onClose());
        if (!alive) {
          // if we unmounted before this resolved, remove immediately
          if (h && typeof h.remove === "function") await h.remove();
        } else {
          handle = h;
        }
      } catch {
        // no-op on web / unsupported platform
      }
    })();

    return () => {
      alive = false;
      if (handle && typeof handle.remove === "function") {
        try { handle.remove(); } catch {}
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        role="presentation"
      />
      <div
        className={`fixed top-0 ${isRTL ? "left-0" : "right-0"} h-full w-64 bg-white dark:bg-slate-800 shadow-xl z-[101] ${
          isOpen ? "animate-slide-in" : isRTL ? "animate-slide-out-left" : "animate-slide-out-right"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t("menu")}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            aria-label={t("close")}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-2">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => {
                  onOrdersClick?.();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ListChecks className="h-5 w-5" />
                <span className="text-base">{t("orders_nav")}</span>
              </button>

              {isDriver && (
                <button
                  onClick={() => {
                    onPickupClick?.();
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Truck className="h-5 w-5" />
                  <span className="text-base">{t("pickup_pool")}</span>
                </button>
              )}

              <button
                onClick={() => {
                  onLogout?.();
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Lock className="h-5 w-5" />
                <span className="text-base">{t("logout")}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onLoginClick?.();
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <User className="h-5 w-5" />
              <span className="text-base">{t("login")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
