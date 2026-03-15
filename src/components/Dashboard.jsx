import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { BadgeCheck, QrCode, PackageCheck, ScanLine, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoUrl from "/sh-logo.png";

const STATS = [
  { labelKey: "dashboard_stat_active",    value: "128" },
  { labelKey: "dashboard_stat_delivered", value: "86" },
  { labelKey: "dashboard_stat_pending",   value: "32" },
];

export default function Dashboard({ isDriver = false, onTrackOrder, onOrders, onDelivered, onScanClaim }) {
  const { t } = useTranslation();
  const greetingRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (greetingRef.current) {
      tl.fromTo(greetingRef.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5 });
    }
    if (statsRef.current) {
      const cards = statsRef.current.querySelectorAll(".stat-card");
      tl.fromTo(cards, { opacity: 0, y: 20, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08 }, "-=0.2");
    }
    if (actionsRef.current) {
      const rows = actionsRef.current.querySelectorAll(".action-row");
      tl.fromTo(rows, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.07 }, "-=0.15");
    }
  }, []);

  const actions = [
    { label: t("dashboard_action_track"),   sub: t("dashboard_action_track_sub"),  icon: QrCode,       onClick: onTrackOrder, show: true },
    { label: t("orders_nav"),               sub: t("dashboard_action_orders"),      icon: PackageCheck, onClick: onOrders,     show: true },
    { label: t("delivered_nav"),            sub: t("dashboard_action_delivered"),   icon: BadgeCheck,   onClick: onDelivered,  show: isDriver },
    { label: t("scan_product"),             sub: t("dashboard_action_scan"),        icon: ScanLine,     onClick: onScanClaim,  show: isDriver },
  ].filter((a) => a.show);

  return (
    <section className="pb-4">
      {/* Greeting */}
      <div ref={greetingRef} className="px-4 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="SHAHEENE" className="h-10 w-10 object-contain rounded-xl" />
          <div>
            <h1 className="text-[22px] font-bold leading-tight text-[#222222]">
              {t("dashboard_subtitle")}
            </h1>
            <p className="text-xs mt-0.5 text-[#717171]">
              {t("dashboard_live_value")}
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div ref={statsRef} className="grid grid-cols-3 gap-3 px-4 mb-6">
        {STATS.map((s) => (
          <div key={s.labelKey} className="stat-card card p-4 text-center">
            <div className="text-[26px] font-bold leading-none text-[#222222]">
              {s.value}
            </div>
            <div className="text-[11px] font-medium mt-1.5 text-[#717171]">
              {t(s.labelKey)}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="section-title">{t("dashboard_title")}</div>
      <div ref={actionsRef} className="mx-4 card overflow-hidden">
        {actions.map(({ label, sub, icon: Icon, onClick }, i) => (
          <button
            key={i}
            type="button"
            onClick={onClick}
            className="action-row flex items-center justify-between w-full px-5 py-4 text-left bg-transparent active:bg-[#F7F7F7] transition-colors"
            style={{ borderBottom: i < actions.length - 1 ? "1px solid #DDDDDD" : "none" }}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 bg-[rgba(255,56,92,0.08)]">
                <Icon size={20} className="text-[#FF385C]" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-[#222222]">{label}</div>
                <div className="text-[12px] mt-0.5 text-[#717171]">{sub}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-[#717171] flex-shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
}
