// src/components/rr/ClaimRewards.jsx
// Claim Rewards: the driver picks one or more approved rewards that are not
// claimed yet and sends them as one claim. The office receives the claim PDF
// by email; the driver can download it here. Claimed rewards can't be picked
// again, so the balance shown is always what is left to claim. One claim a
// month: after it, the rewards stay listed but can't be picked until the
// next month.
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, CheckCircle2, Circle, MapPin, CalendarDays, CalendarClock, Loader2, RefreshCcw, Download, Mail, MailWarning, FileText, Send } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import Money from "../Money.jsx";
import ScreenHeader from "../ScreenHeader.jsx";
import { fetchRewardClaims, createRewardClaim, resendRewardClaimEmail, downloadRewardClaimPdf } from "../../lib/api.js";
import { stagger, fadeUp as item } from "../../lib/motion.js";

const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "");
// Dates, amounts and claim numbers read left to right inside Arabic text.
const Ltr = ({ children }) => <bdi dir="ltr" className="whitespace-nowrap">{children}</bdi>;
// Claim months are Saudi months: show their first day in Saudi time on any phone.
const saudiDay = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Riyadh" }) : "");
const when = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).replace(",", " ·") : "");

function ClaimStatus({ claim }) {
  const { t } = useTranslation();
  return claim.status === "PAID"
    ? <span className="rr-pill rr-pill--ok">{t("claim_status_paid")}</span>
    : <span className="rr-pill rr-pill--wait">{t("claim_status_submitted")}</span>;
}

export default function ClaimRewards({ onBack, toast }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState("");
  const [justSent, setJustSent] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const d = await fetchRewardClaims();
      setData(d);
      // Keep only choices that are still claimable.
      setPicked((prev) => new Set([...prev].filter((id) => d.claimable.some((r) => r.id === id))));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const claimable = data?.claimable || [];
  const b = data?.balance;
  // Older servers send no canClaim: treat as allowed.
  const canClaim = data?.canClaim !== false;
  const allPicked = claimable.length > 0 && picked.size === claimable.length;
  const pickedSar = useMemo(() => claimable.filter((r) => picked.has(r.id)).reduce((s, r) => s + (r.rewardSar || 0), 0), [claimable, picked]);

  const toggle = (id) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setPicked(allPicked ? new Set() : new Set(claimable.map((r) => r.id)));

  const download = async (claim) => {
    setRowBusy(`pdf-${claim.id}`);
    try { await downloadRewardClaimPdf(claim); } catch (e) { toast?.("error", e.message, 3000); } finally { setRowBusy(""); }
  };

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const { claim, skipped } = await createRewardClaim([...picked]);
      setConfirming(false);
      setPicked(new Set());
      setJustSent(claim);
      toast?.("success", t("claim_sent_toast"), 2500);
      if (skipped) toast?.("error", t("claim_skipped", { count: skipped }), 3500);
      await load();
      // The claim PDF is saved to the phone straight away.
      download(claim);
    } catch (e) {
      setConfirming(false);
      setError(e.message);
      await load();
    } finally { setBusy(false); }
  };

  const resend = async (claim) => {
    setRowBusy(`mail-${claim.id}`);
    try {
      const r = await resendRewardClaimEmail(claim.id);
      toast?.(r.sent ? "success" : "error", t(r.sent ? "claim_email_sent" : "claim_email_failed"), 2500);
      await load();
    } catch (e) { toast?.("error", e.message, 3000); } finally { setRowBusy(""); }
  };

  return (
    <section className="pb-6">
      <ScreenHeader title={t("claim_title")} onBack={onBack}>
        <div className="rr-reward-card">
          <div className="rr-gift"><Wallet size={24} /></div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text-2)]">{t("claim_available")}</div>
            <div className="rr-reward-amount">{b ? <Money amount={b.claimableSar} /> : "—"}</div>
          </div>
          <div className="rr-reward-meta">
            <div>{t("claim_rewards_count")}: <b>{b?.claimableCount ?? "—"}</b></div>
            <div>{t("claim_awaiting_payment")}: <b>{b ? <Money amount={b.claimedSar} /> : "—"}</b></div>
            <div>{t("rewards_paid")}: <b>{b ? <Money amount={b.paidSar} /> : "—"}</b></div>
          </div>
        </div>
      </ScreenHeader>

      <div className="px-4 pt-4">
        {justSent && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cl-done">
            <CheckCircle2 size={22} className="flex-shrink-0 text-[#15803D]" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[var(--text)]">{t("claim_done_title")} <Ltr>{justSent.claimNo}</Ltr></div>
              <div className="text-[13px] text-[var(--text-2)] mt-0.5">
                {justSent.email?.sent ? t("claim_done_emailed") : t("claim_done_not_emailed")}
              </div>
            </div>
            <button type="button" className="cl-icon-btn" onClick={() => download(justSent)} aria-label={t("claim_download_pdf")}>
              {rowBusy === `pdf-${justSent.id}` ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </motion.div>
        )}

        <div className="flex items-center justify-between mt-2 mb-3">
          <h2 className="text-[17px] font-bold text-[var(--text)]">{t("claim_choose")}</h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={load} className="p-2 text-[var(--muted)]" aria-label={t("refresh")}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            </button>
            {canClaim && claimable.length > 0 && (
              <button type="button" className="cl-all" onClick={toggleAll}>
                {allPicked ? t("claim_clear_all") : t("claim_select_all")}
              </button>
            )}
          </div>
        </div>

        {error && <div className="rr-error mb-3">{error}</div>}
        {data && !canClaim && (
          <div className="cl-wait">
            <CalendarClock size={20} className="flex-shrink-0" />
            <div>
              <div className="font-bold">{t("claim_month_used")}</div>
              {data.nextClaimFrom && (
                <div className="text-[13px] mt-0.5">{t("claim_next_from")} <Ltr>{saudiDay(data.nextClaimFrom)}</Ltr></div>
              )}
            </div>
          </div>
        )}
        {!data && loading && (
          <div className="flex justify-center py-12"><Loader2 size={26} className="animate-spin text-[var(--red)]" /></div>
        )}
        {data && claimable.length === 0 && (
          <div className="cl-empty">{t("claim_none")}</div>
        )}

        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
          {claimable.map((r) => {
            const on = picked.has(r.id);
            return (
              <motion.button key={r.id} type="button" variants={item} onClick={() => toggle(r.id)} disabled={!canClaim}
                className={`cl-row${on ? " cl-row--on" : ""}`} aria-pressed={canClaim ? on : undefined}>
                {canClaim && (on ? <CheckCircle2 size={24} className="cl-check cl-check--on" /> : <Circle size={24} className="cl-check" />)}
                <div className="min-w-0 flex-1 text-start">
                  <div className="text-[15px] font-bold text-[var(--text)] [overflow-wrap:anywhere]">{t("order_hash")}{r.orderNo}</div>
                  <div className="cl-meta">
                    {r.city && <span><MapPin size={13} />{r.city}</span>}
                    {r.approvedAt && <span><CalendarDays size={13} /><Ltr>{day(r.approvedAt)}</Ltr></span>}
                  </div>
                </div>
                <div className="rr-plus"><Money amount={r.rewardSar} sign="+ " /></div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Claim bar: stays above the tab bar while choosing */}
        {canClaim && claimable.length > 0 && (
          <div className="cl-bar">
            <div className="min-w-0">
              <div className="text-[12px] text-[var(--muted)]">{t("claim_selected", { count: picked.size })}</div>
              <div className="text-[18px] font-extrabold text-[var(--text)] leading-tight"><Money amount={pickedSar} /></div>
            </div>
            <button type="button" className="btn btn-primary cl-claim" disabled={!picked.size || busy} onClick={() => setConfirming(true)}>
              <Send size={17} className="rtl-flip" />{t("claim_cta")}
            </button>
          </div>
        )}

        <h2 className="text-[17px] font-bold text-[var(--text)] mt-7 mb-3">{t("claim_history")}</h2>
        {data && !data.claims.length && <div className="cl-empty">{t("claim_history_empty")}</div>}
        <div className="space-y-2.5">
          {(data?.claims || []).map((c) => (
            <article key={c.id} className="cl-claim-row">
              <div className="cl-doc"><FileText size={20} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-bold text-[var(--text)]" dir="ltr">{c.claimNo}</span>
                  <ClaimStatus claim={c} />
                </div>
                <div className="cl-meta"><span><CalendarDays size={13} /><Ltr>{when(c.createdAt)}</Ltr></span></div>
                <div className="text-[13px] text-[var(--text-2)] mt-1">
                  {t("claim_rewards_count")}: <b>{c.count}</b> · <b><Money amount={c.totalSar} /></b>
                </div>
                {c.email?.failed && (
                  <button type="button" className="cl-retry" onClick={() => resend(c)} disabled={rowBusy === `mail-${c.id}`}>
                    {rowBusy === `mail-${c.id}` ? <Loader2 size={13} className="animate-spin" /> : <MailWarning size={13} />}
                    {t("claim_email_retry")}
                  </button>
                )}
                {c.email?.sent && <div className="cl-sent"><Mail size={13} />{t("claim_emailed")}</div>}
              </div>
              <button type="button" className="cl-icon-btn" onClick={() => download(c)} aria-label={t("claim_download_pdf")}>
                {rowBusy === `pdf-${c.id}` ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* Confirm */}
      <AnimatePresence>
        {confirming && (
          <motion.div className="cl-sheet-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setConfirming(false)}>
            <motion.div className="cl-sheet" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-labelledby="cl-confirm-title">
              <h3 id="cl-confirm-title" className="text-[18px] font-extrabold text-[var(--text)]">{t("claim_confirm_title")}</h3>
              <p className="text-[14px] text-[var(--text-2)] mt-2"><Trans i18nKey="claim_confirm_body" values={{ count: picked.size }} components={{ money: <Money amount={pickedSar} /> }} /></p>
              <div className="cl-sheet-total"><Money amount={pickedSar} /></div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setConfirming(false)} disabled={busy}>{t("cancel")}</button>
                <button type="button" className="btn btn-primary" onClick={submit} disabled={busy}>
                  {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} className="rtl-flip" />}
                  {t("claim_confirm_cta")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
