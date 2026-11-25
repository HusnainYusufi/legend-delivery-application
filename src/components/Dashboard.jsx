// src/components/Dashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { BadgeCheck, Search, PackageCheck, ScanLine, ArrowRight, Box, Truck, CalendarCheck, Star } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import Money from "./Money.jsx";
import iconUrl from "/shaheen-icon.png";
import { fetchMyStats } from "../lib/api.js";
import { getAuth } from "../lib/auth.js";

// The signed-in driver's own numbers, from GET /orders/my-stats.
const STATS = [
  { labelKey: "dashboard_stat_in_transit",      key: "inTransit",      icon: Truck,         accent: "#ffcc02" },
  { labelKey: "dashboard_stat_delivered_today", key: "deliveredToday", icon: CalendarCheck, accent: "#00B87C" },
  { labelKey: "dashboard_stat_delivered_total", key: "deliveredTotal", icon: Box,           accent: "#60A5FA" },
];

export default function Dashboard({ isDriver = false, onTrackOrder, onOrders, onDelivered, onRewards, onScanClaim }) {
  const { t } = useTranslation();
  // Name from the login token; the header greets the driver by it.
  const driverName = (getAuth()?.name || "").trim();
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const heroRef = useRef(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isDriver) return undefined;
    let alive = true;
    fetchMyStats().then((d) => { if (alive) setStats(d); }).catch(() => {});
    return () => { alive = false; };
  }, [isDriver]);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (heroRef.current) {
      tl.from(heroRef.current, { opacity: 0, y: -20, duration: 0.5 });
    }

    if (statsRef.current) {
      const cards = statsRef.current.querySelectorAll(".stat-card");

      tl.from(cards,
        { opacity: 0, y: 24, scale: 0.9, duration: 0.5, stagger: 0.09 },
        "-=0.2"
      );
    }

    if (actionsRef.current) {
      tl.from(actionsRef.current.querySelectorAll(".action-row"),
        { opacity: 0, x: -18, duration: 0.4, stagger: 0.07 },
        "-=0.6"
      );
    }

    return () => { tl.kill(); };
  }, []);

  // Count up once the driver's numbers arrive.
  useEffect(() => {
    if (!stats || !statsRef.current) return undefined;
    const tweens = [...statsRef.current.querySelectorAll(".stat-num")].map((el) => {
      const obj = { val: 0 };
      return gsap.to(obj, {
        val: Number(el.dataset.val) || 0,
        duration: 1.1,
        ease: "power2.out",
        onUpdate: () => { el.textContent = Math.round(obj.val); },
      });
    });
    return () => tweens.forEach((tw) => tw.kill());
  }, [stats]);

  const rv = stats?.reviews;
  const rewardsChips = rv
    ? [
        { text: <Trans i18nKey="dashboard_rewards_earned" components={{ money: <Money amount={rv.earnedSar} /> }} />, cls: "dash-chip dash-chip--ok" },
        { text: t("dashboard_rewards_in_review", { count: rv.pending || 0 }), cls: "dash-chip dash-chip--wait" },
        { text: t("dashboard_rewards_rejected", { count: rv.rejected || 0 }), cls: "dash-chip dash-chip--bad" },
        ...(rv.claimableSar > 0
          ? [{ text: <Trans i18nKey="dashboard_rewards_claimable" components={{ money: <Money amount={rv.claimableSar} /> }} />, cls: "dash-chip dash-chip--claim" }]
          : []),
      ]
    : null;

  const actions = [
    { label: t("dashboard_action_track"),  sub: t("dashboard_action_track_sub"),  icon: Search,       onClick: onTrackOrder, show: true,     accent: "#ffcc02" },
    { label: t("orders_nav"),              sub: t("dashboard_action_orders"),      icon: PackageCheck, onClick: onOrders,     show: true,     accent: "#6366F1" },
    { label: t("delivered_nav"),           sub: t("dashboard_action_delivered"),   icon: BadgeCheck,   onClick: onDelivered,  show: isDriver, accent: "#00B87C" },
    // Reviews & Rewards: right after All Delivered, before Scan Product.
    { label: t("rewards_title"),           sub: t("dashboard_action_rewards"),     icon: Star,         onClick: onRewards,    show: isDriver, accent: "#F5A524", badge: t("badge_new"), chips: rewardsChips },
    { label: t("scan_product"),            sub: t("dashboard_action_scan"),        icon: ScanLine,     onClick: onScanClaim,  show: isDriver, accent: "#F59E0B" },
  ].filter((a) => a.show);

  return (
    <section className="pb-6">
      {/* Dark hero */}
      <div ref={heroRef} className="dash-hero">
        <div className="dash-hero-inner">
          <div className="flex items-center gap-3 mb-6">
            <img src={iconUrl} alt="SHAHEEN" className="h-11 w-11 rounded-[14px] flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold text-white leading-tight tracking-tight [overflow-wrap:anywhere]">
                {driverName
                  ? <Trans i18nKey="dashboard_welcome_name" values={{ name: driverName }} components={{ name: <bdi /> }} />
                  : t("dashboard_welcome")}
              </h1>
            </div>
          </div>

          {/* Stats inside hero: the driver's own, never everyone's */}
          {isDriver && (
          <div ref={statsRef} className="grid grid-cols-3 gap-3">
            {STATS.map((s) => {
              const Icon = s.icon;
              const value = stats?.orders?.[s.key];
              return (
                <div key={s.labelKey} className="stat-card dash-stat-card">
                  <Icon size={14} style={{ color: s.accent }} className="mb-1.5" />
                  <div className="stat-num text-[26px] font-bold text-white tracking-tight" data-val={value ?? 0}>{stats ? 0 : "—"}</div>
                  <div className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">
                    {t(s.labelKey)}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3 px-1">
          {t("dashboard_title")}
        </p>
        <div ref={actionsRef} className="space-y-2.5">
          {actions.map(({ label, sub, icon: Icon, onClick, accent, badge, chips }, i) => (
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
                <div className="text-[14px] font-semibold text-[var(--text)] tracking-tight flex items-center gap-2">
                  {label}
                  {badge && <span className="dash-badge-new">{badge}</span>}
                </div>
                <div className="text-[12px] text-[var(--muted)] mt-0.5">{sub}</div>
                {chips && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chips.map((c) => <span key={c.cls} className={c.cls}>{c.text}</span>)}
                  </div>
                )}
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
