// src/components/rr/UploadReview.jsx
// Upload a Review: opened from an All Delivered card, so the order is filled
// in. A screenshot is required; link and note are optional. Submit puts the
// review in Pending verification. "Save for Later" keeps the draft on this
// phone (per order) and restores it next time.
import React, { useEffect, useRef, useState } from "react";
import { Package, CalendarDays, User, MapPin, ImageIcon, Upload, X, Link2, PencilLine, Info, Send, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import OrderNo from "../OrderNo.jsx";
import ScreenHeader from "../ScreenHeader.jsx";
import { fmtDay } from "../../lib/format.js";
import { submitReview } from "../../lib/api.js";

const NOTE_MAX = 200;
const draftKey = (orderNo) => `ld.reviewDraft.${orderNo}`;
const dayOf = (d) => fmtDay(d);

const readDraft = (orderNo) => {
  try { return JSON.parse(localStorage.getItem(draftKey(orderNo)) || "null"); } catch { return null; }
};
const dataUrlToFile = async (dataUrl, name) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type || "image/jpeg" });
};
const fileToDataUrl = (file) => new Promise((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
});

export default function UploadReview({ order, onBack, onSubmitted, toast }) {
  const { t } = useTranslation();
  const orderNo = order?.orderNo;
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Restore a saved draft for this order.
  useEffect(() => {
    const d = orderNo && readDraft(orderNo);
    if (!d) return;
    setLink(d.link || ""); setNote(d.note || "");
    if (d.shot) dataUrlToFile(d.shot, d.shotName || "review.jpg").then((f) => { setFile(f); setPreview(d.shot); }).catch(() => {});
  }, [orderNo]);

  useEffect(() => () => { if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!/^image\//.test(f.type)) { setError(t("review_image_only")); return; }
    setError("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  // Clear the chosen screenshot before submitting (the ✕ on the preview).
  const removeShot = () => {
    setFile(null);
    setPreview(null);
    setError("");
  };

  const saveForLater = async () => {
    try {
      const shot = file && file.size < 2.5 * 1024 * 1024 ? await fileToDataUrl(file) : null;
      localStorage.setItem(draftKey(orderNo), JSON.stringify({ link, note, shot, shotName: file?.name || null }));
      toast?.("success", t("review_saved_for_later"));
    } catch {
      toast?.("error", t("review_save_failed"));
    }
    onBack?.();
  };

  const submit = async () => {
    if (!file) { setError(t("review_need_screenshot")); return; }
    setBusy(true); setError("");
    try {
      await submitReview({ orderNo, file, link: link.trim(), note: note.trim() });
      try { localStorage.removeItem(draftKey(orderNo)); } catch {}
      toast?.("success", t("review_submitted"), 3000);
      onSubmitted?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deliveredAt = order?.__pkg?.deliveredAt || order?.updatedAt;

  return (
    <section className="pb-6">
      <ScreenHeader title={t("review_upload_title")} onBack={onBack}>
        <div className="ur-order">
          <div className="ur-order-icon"><Package size={26} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="rr-pill rr-pill--ok rr-pill--dot">{t("status_delivered")}</span>
              {deliveredAt && <span className="rr-meta m-0"><CalendarDays size={13} /><bdi>{dayOf(deliveredAt)}</bdi></span>}
            </div>
            <div className="text-[17px] font-bold text-[var(--text)] mt-1 break-all"><OrderNo no={orderNo} /></div>
            {order?.customerName && <div className="rr-meta"><User size={13} />{order.customerName}</div>}
            {order?.city && <div className="rr-meta"><MapPin size={13} />{order.city}</div>}
          </div>
        </div>
      </ScreenHeader>

      <div className="px-4 pt-4">
        <h2 className="ur-label text-[16px]">{t("review_screenshot")}</h2>
        <div className="ur-card">
          <div className="ur-shot">
            <button type="button" className="ur-drop" onClick={() => fileRef.current?.click()}>
              {preview
                ? <img src={preview} alt="" className="ur-preview" />
                : (<>
                    <ImageIcon size={40} className="text-[var(--muted)]" />
                    <span>{t("review_screenshot_hint")}</span>
                  </>)}
            </button>
            {preview && (
              <button type="button" className="ur-remove" onClick={removeShot} disabled={busy} aria-label={t("review_remove_screenshot")}>
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <button type="button" className="btn btn-primary ur-btn w-full mt-3" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload size={17} />{t("review_upload_screenshot")}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        </div>

        <label className="ur-label" htmlFor="ur-link">{t("review_link")} <span>({t("optional")})</span></label>
        <div className="ur-input">
          <Link2 size={17} />
          <input id="ur-link" type="url" inputMode="url" placeholder={t("review_link_ph")} value={link} onChange={(e) => setLink(e.target.value)} />
        </div>

        <label className="ur-label" htmlFor="ur-note">{t("review_note")} <span>({t("optional")})</span></label>
        <div className="ur-input ur-input--area">
          <PencilLine size={17} />
          <textarea id="ur-note" rows={2} maxLength={NOTE_MAX} placeholder={t("review_note_ph")} value={note} onChange={(e) => setNote(e.target.value)} />
          <span className="ur-count">{note.length} / {NOTE_MAX}</span>
        </div>

        <div className="ur-info">
          <Info size={20} />
          <span>{t("review_verify_note")} {t("review_window_note")}</span>
        </div>

        {error && <div className="rr-error mt-3">{error}</div>}

        <button type="button" className="btn btn-primary w-full mt-4 ur-submit" disabled={busy || !file} onClick={submit}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="rtl-flip" />}
          {t("review_submit")}
        </button>
        <button type="button" className="ur-later" onClick={saveForLater} disabled={busy}>{t("review_save_later")}</button>
      </div>
    </section>
  );
}
