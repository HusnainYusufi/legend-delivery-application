// src/components/rr/ReviewsRewards.jsx
// Reviews & Rewards: the driver's own earnings (their share only) and the
// status of every review they sent. Reviews are sent from All Delivered, so
// there is no general Upload button here.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, XCircle, Gift, MapPin, CalendarDays, ImageIcon, Loader2, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import ScreenHeader from "../ScreenHeader.jsx";
import usePrivateImage from "./usePrivateImage.js";
import { fetchMyReviews } from "../../lib/api.js";
import { stagger, fadeUp as item } from "../../lib/motion.js";

const FILTERS = ["ALL", "APPROVED", "PENDING", "REJECTED"];
const sar = (n) => `SAR ${Number(n || 0).toLocaleString("en-US")}`;
const when = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", " ·") : "");

function Thumb({ path }) {
  const { url } = usePrivateImage(path);
  return (
    <div className="rr-thumb">
      {url ? <img src={url} alt="" /> : <ImageIcon size={22} className="text-[var(--muted)]" />}
    </div>
  );
}

function StatusPill({ status }) {
  const { t } = useTranslation();
  const cls = status === "APPROVED" ? "rr-pill rr-pill--ok" : status === "REJECTED" ? "rr-pill rr-pill--bad" : "rr-pill rr-pill--wait";
  return <span className={cls}>{t(`review_status_${status.toLowerCase()}`)}</span>;
}

export default function ReviewsRewards({ onBack }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("ALL");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try { setData(await fetchMyReviews()); } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const s = data?.summary;
  const reviews = (data?.reviews || []).filter((r) => filter === "ALL" || r.status === filter);

  return (
    <section className="pb-6">
      <ScreenHeader title={t("rewards_title")} onBack={onBack}>
        <div className="rr-reward-card">
          <div className="rr-gift"><Gift size={24} /></div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text-2)]">{t("rewards_my")}</div>
            <div className="rr-reward-amount">{s ? sar(s.earnedSar) : "—"}</div>
          </div>
          <div className="rr-reward-meta">
            <div>{t("rewards_approved_reviews")}: <b>{s?.approved ?? "—"}</b></div>
            <div>{t("rewards_per_review")}: <b>{s ? sar(s.rewardPerReviewSar) : "—"}</b></div>
            {s && s.earnedSar > 0 && (
              <div className="rr-paid">{t("rewards_paid")} {sar(s.paidSar)} · {t("rewards_unpaid")} {sar(s.unpaidSar)}</div>
            )}
          </div>
        </div>
      </ScreenHeader>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "approved", v: s?.approved, Icon: CheckCircle2, c: "#16A34A" },
            { k: "pending", v: s?.pending, Icon: Clock3, c: "#F59E0B" },
            { k: "rejected", v: s?.rejected, Icon: XCircle, c: "#DC2626" },
          ].map(({ k, v, Icon, c }) => (
            <div key={k} className="rr-stat">
              <Icon size={20} style={{ color: c }} />
              <div className="rr-stat-num">{v ?? "—"}</div>
              <div className="rr-stat-label">{t(`review_status_${k}`)}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-[17px] font-bold text-[var(--text)]">{t("rewards_my_reviews")}</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="p-2 text-[var(--muted)]" aria-label={t("refresh")}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            </button>
            <select className="rr-filter" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t("rewards_filter")}>
              {FILTERS.map((f) => <option key={f} value={f}>{t(f === "ALL" ? "rewards_all_reviews" : `review_status_${f.toLowerCase()}`)}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="rr-error">{error}</div>}
        {!data && loading && (
          <div className="flex justify-center py-12"><Loader2 size={26} className="animate-spin text-[var(--red)]" /></div>
        )}
        {data && reviews.length === 0 && (
          <div className="text-center text-sm text-[var(--muted)] py-12">{t("rewards_empty")}</div>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {reviews.map((r) => (
            <motion.article key={r.id} variants={item} className="rr-row">
              <Thumb path={r.screenshotUrl} />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-[var(--text)] break-all">{t("order_hash")}{r.orderNo}</div>
                {r.city && <div className="rr-meta"><MapPin size={13} />{r.city}</div>}
                <div className="rr-meta"><CalendarDays size={13} />{when(r.submittedAt)}</div>
                {r.status === "REJECTED" && r.rejectReason && <div className="rr-reason">{r.rejectReason}</div>}
              </div>
              <div className="rr-row-end">
                <StatusPill status={r.status} />
                {r.status === "APPROVED" && <div className="rr-plus">+ {sar(r.rewardSar)}</div>}
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
