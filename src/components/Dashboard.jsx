import React from "react";
import {
  Activity,
  BadgeCheck,
  Boxes,
  ClipboardList,
  PackageCheck,
  QrCode,
  ScanLine,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoUrl from "/sh-logo.png";

const STAT_CARDS = [
  {
    labelKey: "dashboard_stat_active",
    value: "128",
    icon: Activity,
    accent: "from-sky-500 to-cyan-500",
  },
  {
    labelKey: "dashboard_stat_delivered",
    value: "86",
    icon: BadgeCheck,
    accent: "from-emerald-500 to-lime-500",
  },
  {
    labelKey: "dashboard_stat_pending",
    value: "32",
    icon: ClipboardList,
    accent: "from-amber-500 to-orange-500",
  },
  {
    labelKey: "dashboard_stat_returns",
    value: "4",
    icon: Boxes,
    accent: "from-purple-500 to-indigo-500",
  },
];

export default function Dashboard({
  isDriver = false,
  onTrackOrder,
  onOrders,
  onDelivered,
  onScanClaim,
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6 view-animate">
      <div className="dashboard-hero relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-slate-900/60">
        <div className="absolute inset-0 opacity-60">
          <div className="dashboard-glow" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t("dashboard_title")}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t("dashboard_subtitle")}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-300">
              {t("dashboard_description")}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 px-5 py-4 shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="shaheene-loader">
              <img src={logoUrl} alt="SHAHEENE" className="h-10 w-10" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t("dashboard_live_label")}
              </p>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {t("dashboard_live_value")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.labelKey}
              className="dashboard-stat group relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/70 dark:bg-slate-900/80"
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t(stat.labelKey)}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg shadow-slate-200/50 transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-1.5 w-2/3 rounded-full bg-gradient-to-r ${stat.accent}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <button
          type="button"
          onClick={onTrackOrder}
          className="dashboard-action group"
        >
          <div className="dashboard-action-icon bg-gradient-to-br from-indigo-500 to-purple-500">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("dashboard_action_track")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {t("dashboard_action_track_sub")}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={onOrders}
          className="dashboard-action group"
        >
          <div className="dashboard-action-icon bg-gradient-to-br from-emerald-500 to-lime-500">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("orders_nav")}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {t("dashboard_action_orders")}
            </p>
          </div>
        </button>

        {isDriver && (
          <button
            type="button"
            onClick={onDelivered}
            className="dashboard-action group"
          >
            <div className="dashboard-action-icon bg-gradient-to-br from-sky-500 to-cyan-500">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("delivered_nav")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("dashboard_action_delivered")}
              </p>
            </div>
          </button>
        )}

        {isDriver && (
          <button
            type="button"
            onClick={onScanClaim}
            className="dashboard-action group"
          >
            <div className="dashboard-action-icon bg-gradient-to-br from-amber-500 to-orange-500">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("scan_product")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {t("dashboard_action_scan")}
              </p>
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
