// src/components/Navbar.jsx — BottomTabBar with Framer Motion + GSAP
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { Home, ClipboardList, QrCode, CheckCircle, User, X, LogOut, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { backdrop, sheet } from "../lib/motion.js";

export default function BottomTabBar({
  view,
  setView,
  isDriver = false,
  onLogout,
  language,
  onChangeLanguage,
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  /* GSAP: slide bar up on mount */
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
      { id: "delivered",  icon: CheckCircle, label: t("delivered_nav") || "Delivered" },
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
              style={{ color: isActive ? "var(--red)" : "var(--muted)" }}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                {/* Framer Motion layoutId indicator — slides between active tabs */}
                {isActive && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF385C]"
                    transition={{ type: "spring", damping: 26, stiffness: 360 }}
                  />
                )}
              </div>
              <span className="mt-0.5">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Menu sheet — Framer Motion AnimatePresence with spring */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[110] bg-black/40 flex items-end justify-center"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              key="menu-sheet"
              variants={sheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-[480px] bg-white rounded-t-2xl p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-[#DDDDDD] rounded-full mx-auto mb-6" />

              <button
                className="absolute top-4 right-4 p-2 text-[#717171]"
                onClick={() => setMenuOpen(false)}
              >
                <X size={20} />
              </button>

              {/* Language */}
              <div className="flex items-center justify-between py-4 border-b border-[#DDDDDD]">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-[#717171]" />
                  <span className="font-medium text-[#222222]">{t("language") || "Language"}</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => onChangeLanguage?.(e.target.value)}
                  className="border border-[#DDDDDD] rounded-lg px-3 py-1.5 text-sm font-medium text-[#222222] bg-white outline-none"
                >
                  <option value="en">EN</option>
                  <option value="ar">AR</option>
                </select>
              </div>

              {/* Logout */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setMenuOpen(false); onLogout?.(); }}
                className="flex items-center gap-3 w-full py-4 text-[#FF385C]"
              >
                <LogOut size={20} />
                <span className="font-semibold text-base">{t("logout") || "Logout"}</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
