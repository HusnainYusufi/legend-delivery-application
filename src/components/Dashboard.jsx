// src/components/Dashboard.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { BadgeCheck, QrCode, PackageCheck, ScanLine, ArrowRight, Box, Truck, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoUrl from "/sh-logo.png";

const STATS = [
  { labelKey: "dashboard_stat_active",    value: 128, icon: Truck,  accent: "#FF385C" },
  { labelKey: "dashboard_stat_delivered", value: 86,  icon: Box,    accent: "#00B87C" },
  { labelKey: "dashboard_stat_pending",   value: 32,  icon: Clock,  accent: "#F59E0B" },
];

export default function Dashboard({ isDriver = false, onTrackOrder, onOrders, onDelivered, onScanClaim }) {
  const { t } = useTranslation();
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (heroRef.current) {
      tl.from(heroRef.current, { opacity: 0, y: -20, duration: 0.5 });
    }

    if (statsRef.current) {
      const cards = statsRef.current.querySelectorAll(".stat-card");
      const nums = statsRef.current.querySelectorAll(".stat-num");

      tl.from(cards,
        { opacity: 0, y: 24, scale: 0.9, duration: 0.5, stagger: 0.09 },
        "-=0.2"
      );

      nums.forEach((el) => {
        const target = parseInt(el.dataset.val, 10);
        const obj = { val: 0 };
        tl.to(obj, {
          val: target,
          duration: 1.1,
          ease: "power2.out",
          onUpdate: () => { el.textContent = Math.round(obj.val); },
        }, "<0.15");
      });
    }

    if (actionsRef.current) {
      tl.from(actionsRef.current.querySelectorAll(".action-row"),
        { opacity: 0, x: -18, duration: 0.4, stagger: 0.07 },
        "-=0.6"
      );
    }
  }, []);

  const actions = [
    { label: t("dashboard_action_track"),  sub: t("dashboard_action_track_sub"),  icon: QrCode,       onClick: onTrackOrder, show: true,     accent: "#FF385C" },
    { label: t("orders_nav"),              sub: t("dashboard_action_orders"),      icon: PackageCheck, onClick: onOrders,     show: true,     accent: "#6366F1" },
    { label: t("delivered_nav"),           sub: t("dashboard_action_delivered"),   icon: BadgeCheck,   onClick: onDelivered,  show: isDriver, accent: "#00B87C" },
    { label: t("scan_product"),            sub: t("dashboard_action_scan"),        icon: ScanLine,     onClick: onScanClaim,  show: isDriver, accent: "#F59E0B" },
  ].filter((a) => a.show);

  return (
    <section className="pb-6">
      {/* Dark hero */}
      <div ref={heroRef} className="dash-hero">
        <div className="dash-hero-inner">
          <div className="flex items-center gap-3 mb-6">
            <div className="dash-logo-ring">
              <img src={logoUrl} alt="SHAHEENE" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-white/50 uppercase tracking-widest">
                {t("dashboard_live_value")}
              </p>
              <h1 className="text-[20px] font-bold text-white leading-tight tracking-tight">
                {t("dashboard_subtitle")}
              </h1>
            </div>
          </div>

          {/* Stats inside hero */}
          <div ref={statsRef} className="grid grid-cols-3 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.labelKey} className="stat-card dash-stat-card">
                  <Icon size={14} style={{ color: s.accent }} className="mb-1.5" />
                  <div className="stat-num text-[26px] font-bold text-white tracking-tight" data-val={s.value}>0</div>
                  <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
                    {t(s.labelKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3 px-1">
          {t("dashboard_title")}
        </p>
        <div ref={actionsRef} className="space-y-2.5">
          {actions.map(({ label, sub, icon: Icon, onClick, accent }, i) => (
            <motion.button
              key={i}
              type="button"
              onClick={onClick}
              whileTap={{ scale: 0.982 }}
              className="action-row dash-action-card"
            >
              {/* Left accent line */}
              <div className="dash-action-accent" style={{ background: accent }} />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}18` }}
              >
                <Icon size={18} style={{ color: accent }} />
              </div>

              <div className="flex-1 min-w-0 text-start">
                <div className="text-[14px] font-semibold text-[var(--text)] tracking-tight">{label}</div>
                <div className="text-[12px] text-[var(--muted)] mt-0.5">{sub}</div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[var(--bg)] flex items-center justify-center flex-shrink-0">
                <ArrowRight size={13} className="text-[var(--muted)]" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
