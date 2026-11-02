// src/components/Navbar.jsx — BottomTabBar with pill indicator
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { Home, ClipboardList, QrCode, CheckCircle, User, X, LogOut, Globe, Trash2, Mail, FileText, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { backdrop, sheet } from "../lib/motion.js";
import { getAuth } from "../lib/auth.js";

// Account deletion is handled by support within 24 hours (see the policy page).
const SUPPORT_EMAIL = "support@legendsleepsa.com";
const PRIVACY_PAGE = "https://shaheene.com/privacy";
const DELETE_PAGE = (lang) => `https://tracking.shaheene.com/legal/delete-account-${lang === "ar" ? "ar" : "en"}.html`;

// The Capacitor WebView hands mailto: and external https: links to the system
// (mail app / browser) when the page navigates to them.
const openExternal = (url) => { window.location.href = url; };


export default function BottomTabBar({ view, setView, isDriver = false, onLogout, language, onChangeLanguage }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const requestDeletion = () => {
    const a = getAuth() || {};
    const subject = "Delete my Shaheen Driver account";
    const body = [
      "Please delete my Shaheen Driver account.",
      "",
      `Account email: ${a.email || ""}`,
      `Name: ${a.name || ""}`,
      `User ID: ${a.userId || ""}`,
    ].join("\n");
    openExternal(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

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
    { id: "__menu",     icon: Globe,         label: t("menu") || "Menu" },
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
                    style={{ background: "rgba(255,204,2,0.1)" }}
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
                  onClick={() => { setMenuOpen(false); openExternal(PRIVACY_PAGE); }}
                  className="flex items-center gap-3 w-full py-4 border-b border-[#EBEBEB]"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                    <ShieldCheck size={18} className="text-[var(--muted)]" />
                  </div>
                  <span className="font-medium text-[var(--text)]">{t("privacy_policy")}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); onLogout?.(); }}
                  className="flex items-center gap-3 w-full py-4"
                >
                  <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <LogOut size={18} className="text-[#ffcc02]" />
                  </div>
                  <span className="font-semibold text-[#ffcc02] text-[15px]">{t("logout") || "Logout"}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setMenuOpen(false); setDeleteOpen(true); }}
                  className="flex items-center gap-3 w-full py-4 border-t border-[#EBEBEB]"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <Trash2 size={18} className="text-[#d50412]" />
                  </div>
                  <span className="font-semibold text-[#d50412] text-[15px]">{t("delete_account")}</span>
                </motion.button>
              </div>

              <div className="h-[env(safe-area-inset-bottom,16px)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteOpen && (
          <motion.div
            key="delete-backdrop"
            variants={backdrop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[110] bg-black/50 flex items-end justify-center"
            onClick={() => setDeleteOpen(false)}
          >
            <motion.div
              key="delete-sheet"
              variants={sheet}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-[480px] bg-white rounded-t-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-[#EBEBEB] rounded-full mx-auto mt-3 mb-0" />
              <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 size={20} className="text-[#d50412]" />
                </div>
                <h3 className="font-bold text-[17px] text-[var(--text)]">{t("delete_account")}</h3>
              </div>
              <div className="px-5 pb-2 text-[14px] leading-relaxed text-[var(--muted)]">
                <p>{t("delete_account_body")}</p>
                <p className="mt-2">
                  {t("delete_account_email")}{" "}
                  <span dir="ltr" className="font-semibold text-[var(--text)] select-all">{SUPPORT_EMAIL}</span>
                </p>
              </div>
              <div className="px-5 py-3 flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={requestDeletion}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white bg-[#d50412]"
                >
                  <Mail size={18} /> {t("delete_account_send")}
                </motion.button>
                <button
                  onClick={() => openExternal(DELETE_PAGE(language))}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-[var(--text)] bg-[#F5F5F5]"
                >
                  <FileText size={18} /> {t("delete_account_policy")}
                </button>
                <button
                  onClick={() => setDeleteOpen(false)}
                  className="w-full py-3 font-semibold text-[var(--muted)]"
                >
                  {t("cancel")}
                </button>
              </div>
              <div className="h-[env(safe-area-inset-bottom,16px)]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
