// src/components/Navbar.jsx — BottomTabBar with pill indicator
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { Home, ClipboardList, QrCode, CheckCircle, User, X, LogOut, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { backdrop, sheet } from "../lib/motion.js";

export default function BottomTabBar({ view, setView, isDriver = false, onLogout, language, onChangeLanguage }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
      );
    }
  }, []);

  const tabs = [
    { id: "dashboard",  icon: Home,          label: t("dashboard_title") || "Home" },
    { id: "orders",     icon: ClipboardList, label: t("orders_nav") || "Orders" },
    ...(isDriver ? [
      { id: "scan-claim", icon: QrCode,      label: t("scan_product") || "Scan" },
      { id: "delivered",  icon: CheckCircle, label: t("delivered_nav") || "Done" },
    ] : []),
    { id: "__menu",     icon: User,          label: t("menu") || "Menu" },
  ];

  const handleTab = (id) => {
    if (id === "__menu") { setMenuOpen(true); return; }
    setView(id);
  };

  return (
    <>
      <nav ref={navRef} className="bottom-tab-bar">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = view === id;
          return (
            <button
              key={id}
              className="bottom-tab"
              onClick={() => handleTab(id)}
            >
              <div className="relative flex flex-col items-center justify-center gap-0.5 w-full py-1.5">
                {/* Pill background — layoutId slides it smoothly between active tabs */}
                {isActive && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-x-2 -inset-y-0.5 rounded-2xl"
                    style={{ background: "rgba(255,56,92,0.1)" }}
                    transition={{ type: "spring", damping: 26, stiffness: 340 }}
                  />
                )}
                <div className="relative z-10" style={{ color: isActive ? "var(--red)" : "var(--muted)" }}>
                  <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
                </div>
                <span
                  className="relative z-10 text-[10px] font-semibold tracking-tight"
                  style={{ color: isActive ? "var(--red)" : "var(--muted)" }}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[110] bg-black/50 flex items-end justify-center"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              key="menu-sheet"
              variants={sheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-[480px] bg-white rounded-t-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-[#EBEBEB] rounded-full mx-auto mt-3 mb-0" />

              <div className="px-5 py-4 border-b border-[#EBEBEB]">
                <h3 className="font-bold text-[17px] text-[var(--text)]">{t("menu") || "Menu"}</h3>
              </div>

              <div className="px-5 py-2">
                <div className="flex items-center justify-between py-4 border-b border-[#EBEBEB]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                      <Globe size={18} className="text-[var(--muted)]" />
                    </div>
                    <span className="font-medium text-[var(--text)]">{t("language") || "Language"}</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => onChangeLanguage?.(e.target.value)}
                    className="border border-[#EBEBEB] rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text)] bg-[#F5F5F5] outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); onLogout?.(); }}
                  className="flex items-center gap-3 w-full py-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut size={18} className="text-[#FF385C]" />
                  </div>
                  <span className="font-semibold text-[#FF385C] text-[15px]">{t("logout") || "Logout"}</span>
                </motion.button>
              </div>

              <div className="h-[env(safe-area-inset-bottom,16px)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
