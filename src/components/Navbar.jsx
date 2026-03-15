// src/components/Navbar.jsx — repurposed as BottomTabBar
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Home, ClipboardList, QrCode, CheckCircle, User, X, LogOut, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  /* Animate tab bar in on mount */
  useEffect(() => {
    if (navRef.current) {
      gsap.fromTo(navRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", delay: 0.1 });
    }
  }, []);

  /* Animate menu sheet */
  useEffect(() => {
    if (menuOpen && sheetRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      gsap.fromTo(sheetRef.current, { y: "100%" }, { y: "0%", duration: 0.35, ease: "power3.out" });
    }
  }, [menuOpen]);

  const closeMenu = () => {
    if (sheetRef.current && backdropRef.current) {
      gsap.to(sheetRef.current, { y: "100%", duration: 0.25, ease: "power2.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.2, onComplete: () => setMenuOpen(false) });
    } else {
      setMenuOpen(false);
    }
  };

  const tabs = [
    { id: "dashboard", icon: Home,          label: t("dashboard_title") || "Home" },
    { id: "orders",    icon: ClipboardList, label: t("orders_nav") || "Orders" },
    ...(isDriver ? [
      { id: "scan-claim", icon: QrCode,       label: t("scan_product") || "Scan" },
      { id: "delivered",  icon: CheckCircle,  label: t("delivered_nav") || "Delivered" },
    ] : []),
    { id: "__menu",    icon: User,           label: t("menu") || "Menu" },
  ];

  const handleTab = (id) => {
    if (id === "__menu") { setMenuOpen(true); return; }
    setView(id);
  };

  return (
    <>
      <nav ref={navRef} className="bottom-tab-bar">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`bottom-tab${view === id ? " active" : ""}`}
            onClick={() => handleTab(id)}
          >
            <Icon size={22} strokeWidth={view === id ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Menu bottom sheet */}
      {menuOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-[110] bg-black/40 modal-backdrop"
          onClick={closeMenu}
        >
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-10 max-w-[480px] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-[#DDDDDD] rounded-full mx-auto mb-6" />

            <button
              className="absolute top-4 right-4 p-2 text-[#717171]"
              onClick={closeMenu}
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
                onChange={(e) => { onChangeLanguage?.(e.target.value); }}
                className="border border-[#DDDDDD] rounded-lg px-3 py-1.5 text-sm font-medium text-[#222222] bg-white outline-none"
              >
                <option value="en">EN</option>
                <option value="ar">AR</option>
              </select>
            </div>

            {/* Logout */}
            <button
              onClick={() => { closeMenu(); onLogout?.(); }}
              className="flex items-center gap-3 w-full py-4 text-[#FF385C]"
            >
              <LogOut size={20} />
              <span className="font-semibold text-base">{t("logout") || "Logout"}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
