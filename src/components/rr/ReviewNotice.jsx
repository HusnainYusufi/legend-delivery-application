// src/components/rr/ReviewNotice.jsx
// Pop-up when Shaheen AI (or the office) decides one of the driver's reviews:
// approved -> "You earned 5 SAR", rejected -> the reason. Checks on start, when
// the app comes back to the foreground, and every minute while it is open.
// A notice is marked seen on the server once the driver closes it.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { App as CapApp } from "@capacitor/app";
import { fetchReviewNotifications, markReviewNotificationsSeen } from "../../lib/api.js";
import { rejectText } from "./rejectText.js";

const POLL_MS = 60000;

export default function ReviewNotice({ onOpenRewards, onReupload }) {
  const { t } = useTranslation();
  const [queue, setQueue] = useState([]);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current || document.visibilityState === "hidden") return;
    busy.current = true;
    try {
      const data = await fetchReviewNotifications();
      const list = data?.notifications || [];
      setQueue((q) => [...q, ...list.filter((n) => !q.some((x) => x.id === n.id))]);
    } catch {
      // Offline or no access: try again on the next tick.
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    check();
    const timer = setInterval(check, POLL_MS);
    let sub = null;
    CapApp.addListener("resume", check).then((h) => { sub = h; }).catch(() => {});
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      sub?.remove?.();
      document.removeEventListener("visibilitychange", check);
    };
  }, [check]);

  const current = queue[0] || null;
  const close = (then) => {
    if (!current) return;
    markReviewNotificationsSeen([current.id]).catch(() => {});
    setQueue((q) => q.slice(1));
    then?.(current);
  };

  const approved = current?.status === "APPROVED";

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true"
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 24 }}
          >
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: approved ? "rgba(255,204,2,0.18)" : "rgba(220,38,38,0.1)" }}
            >
              {approved ? <Gift size={32} color="#B38F00" /> : <XCircle size={32} color="#DC2626" />}
            </div>

            {approved ? (
              <>
                <div className="text-[13px] font-semibold uppercase tracking-wide text-[#717171]">{t("review_notice_earned")}</div>
                <div className="mt-1 text-4xl font-extrabold text-[#1A1A1A]">
                  {t("review_notice_amount", { amount: current.rewardSar })}
                </div>
                <p className="mt-3 text-sm text-[#484848]">{t("review_notice_approved_body", { orderNo: current.orderNo })}</p>
              </>
            ) : (
              <>
                <div className="text-xl font-bold text-[#1A1A1A]">{t("review_notice_rejected_title")}</div>
                <p className="mt-2 text-sm text-[#484848]">{t("review_notice_rejected_body", { orderNo: current.orderNo })}</p>
                {rejectText(t, current) && (
                  <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{rejectText(t, current)}</div>
                )}
              </>
            )}

            <div className="mt-6 grid gap-2">
              {approved ? (
                <button className="btn-primary btn w-full" onClick={() => close(onOpenRewards)}>{t("review_notice_view_rewards")}</button>
              ) : (
                <button className="btn-primary btn w-full" onClick={() => close(onReupload)}>{t("review_upload_again")}</button>
              )}
              <button className="btn-outline btn w-full" onClick={() => close()}>{t("review_notice_ok")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
