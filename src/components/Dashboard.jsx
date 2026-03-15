// src/components/Dashboard.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { BadgeCheck, QrCode, PackageCheck, ScanLine, ArrowUpRight, Box, Truck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoUrl from "/sh-logo.png";
import { stagger, fadeUp } from "../lib/motion.js";

const STATS = [
  { labelKey: "dashboard_stat_active",    value: 128, icon: Truck,  color: "#FF385C" },
  { labelKey: "dashboard_stat_delivered", value: 86,  icon: Box,    color: "#00B87C" },
  { labelKey: "dashboard_stat_pending",   value: 32,  icon: Clock,  color: "#F59E0B" },
];

export default function Dashboard({ isDriver = false, onTrackOrder, onOrders, onDelivered, onScanClaim }) {
  const { t } = useTranslation();
  const statsRef = useRef(null);
  const actionsRef = useRef(null);

  /* GSAP: animate stats numbers counting up + actions stagger */
  useEffect(() => {
    if (statsRef.current) {
      const els = statsRef.current.querySelectorAll(".stat-num");
      els.forEach((el) => {
        const target = parseInt(el.dataset.val, 10);
        gsap.fromTo({ val: 0 }, { val: target, duration: 1.2, ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].val); }
        });
      });
      gsap.fromTo(statsRef.current.querySelectorAll(".stat-card"),
        { opacity: 0, y: 24, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: "power3.out", delay: 0.1 }
      );
    }

    if (actionsRef.current) {
      gsap.fromTo(actionsRef.current.querySelectorAll(".action-row"),
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: "power3.out", delay: 0.35 }
      );
    }
  }, []);

  const actions = [
    { label: t("dashboard_action_track"),   sub: t("dashboard_action_track_sub"),  icon: QrCode,       onClick: onTrackOrder, show: true,    color: "#FF385C" },
    { label: t("orders_nav"),               sub: t("dashboard_action_orders"),      icon: PackageCheck, onClick: onOrders,     show: true,    color: "#6366F1" },
    { label: t("delivered_nav"),            sub: t("dashboard_action_delivered"),   icon: BadgeCheck,   onClick: onDelivered,  show: isDriver, color: "#00B87C" },
    { label: t("scan_product"),             sub: t("dashboard_action_scan"),        icon: ScanLine,     onClick: onScanClaim,  show: isDriver, color: "#F59E0B" },
  ].filter((a) => a.show);

  return (
    <section className="pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 pt-6 pb-5 flex items-center gap-3"
      >
        <img src={logoUrl} alt="SHAHEENE" className="h-11 w-11 object-contain rounded-2xl" style={{ boxShadow: "0 2px 12px rgba(255,56,92,0.2)" }} />
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-[#1A1A1A] tracking-tight">
            {t("dashboard_subtitle")}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {t("dashboard_live_value")}
          </p>
        </div>
      </motion.div>

      {/* Stats row */}
      <div ref={statsRef} className="grid grid-cols-3 gap-3 px-4 mb-6">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.labelKey}
              className="stat-card card p-4 overflow-hidden relative"
              style={{ opacity: 0 }}
            >
              {/* Subtle color accent */}
              <div
                className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-10 -translate-y-3 translate-x-3"
                style={{ background: s.color }}
              />
              <Icon size={16} style={{ color: s.color }} className="mb-2" />
              <div
                className="stat-num text-[28px] font-bold leading-none tracking-tight"
                style={{ color: "var(--text)" }}
                data-val={s.value}
              >
                0
              </div>
              <div className="text-[10px] font-medium mt-1.5 uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {t(s.labelKey)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="section-title">{t("dashboard_title")}</div>
      <div ref={actionsRef} className="px-4 space-y-3">
        {actions.map(({ label, sub, icon: Icon, onClick, color }, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={onClick}
            whileTap={{ scale: 0.985 }}
            className="action-row card flex items-center justify-between w-full px-4 py-4 text-left"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>{label}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--muted)" }}>{sub}</div>
              </div>
            </div>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "var(--bg)" }}
            >
              <ArrowUpRight size={14} style={{ color: "var(--muted)" }} />
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
