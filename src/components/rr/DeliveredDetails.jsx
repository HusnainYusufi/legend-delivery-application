// src/components/rr/DeliveredDetails.jsx
// Order Details for a delivered parcel: OTP Verified (this parcel), Proof of
// Delivery photo with one Upload button underneath and an x on the photo to
// remove it, and when it was delivered.
import React, { useRef, useState } from "react";
import { Package, MapPin, User, CheckCircle2, CircleDashed, ImageUp, CalendarDays, Loader2, ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fmtDateTime } from "../../lib/format.js";
import OrderNo from "../OrderNo.jsx";
import ScreenHeader from "../ScreenHeader.jsx";
import usePrivateImage from "./usePrivateImage.js";
import { uploadPodPhoto, removePodPhoto } from "../../lib/api.js";

const when = (d) => fmtDateTime(d) || "—";

export default function DeliveredDetails({ order, onBack, toast }) {
  const { t } = useTranslation();
  const pickRef = useRef(null);
  const [pod, setPod] = useState(order?.pod || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { url, loading } = usePrivateImage(pod?.photoUrl || null);

  const pkg = order?.__pkg || {};
  const otpKey = pkg.pkgKey || pkg.driverRefShort || pkg.driverRef || null;
  const parcelNote = pkg.total > 1 ? t("parcel_x_of_y", { x: pkg.index, y: pkg.total }) : null;

  const upload = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true); setError("");
    try {
      const res = await uploadPodPhoto(order.orderNo, pkg.id, f);
      setPod(res.pod);
      toast?.("success", t("pod_saved"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // The x on the photo: the server hides it and returns the photo now shown
  // for this parcel (an earlier one, or none).
  const remove = async () => {
    if (!pod?.id) return;
    setBusy(true); setError("");
    try {
      const res = await removePodPhoto(pod.id);
      setPod(res.pod || null);
      toast?.("success", t("pod_removed"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="pb-6">
      <ScreenHeader title={t("order_details_title")} onBack={onBack}>
        <div className="ur-order">
          <div className="ur-order-icon ur-order-icon--grey"><Package size={28} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <div className="text-[18px] font-bold text-[var(--text)] [overflow-wrap:anywhere]"><OrderNo no={order?.orderNo} /></div>
              <span className="rr-pill rr-pill--ok rr-pill--check"><CheckCircle2 size={14} />{t("status_delivered")}</span>
            </div>
            {order?.city && <div className="rr-meta"><MapPin size={14} />{order.city}</div>}
            {order?.customerName && <div className="rr-meta"><User size={14} />{order.customerName}</div>}
          </div>
        </div>
      </ScreenHeader>

      <div className="px-4 pt-4 space-y-3">
        <div className="dd-row">
          <CheckCircle2 size={30} className="dd-ok" fill="#16A34A" color="#fff" />
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-[var(--text)]">{t("otp_verified")}</div>
            {parcelNote && <div className="text-[12px] text-[var(--muted)]">{parcelNote}</div>}
          </div>
          {otpKey && <span className="dd-key">{otpKey}</span>}
        </div>

        <div className="dd-card">
          <div className="flex items-center gap-3 mb-3">
            {pod
              ? <CheckCircle2 size={30} className="dd-ok" fill="#16A34A" color="#fff" />
              : <CircleDashed size={30} className="text-[var(--muted)]" />}
            <div className="text-[17px] font-bold text-[var(--text)]">{t("pod_title")}</div>
          </div>

          <div className="ur-shot">
            <div className="dd-photo">
              {busy || loading
                ? <Loader2 size={28} className="animate-spin text-[var(--red)]" />
                : url
                  ? <img src={url} alt={t("pod_title")} />
                  : (<div className="flex flex-col items-center gap-2 text-[var(--muted)] text-sm"><ImageIcon size={38} />{t("pod_none")}</div>)}
            </div>
            {pod && url && !busy && (
              <button type="button" className="ur-remove" onClick={remove} aria-label={t("pod_remove")}>
                <X size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <button type="button" className="btn btn-primary ur-btn w-full mt-3" disabled={busy} onClick={() => pickRef.current?.click()}>
            <ImageUp size={17} />{t("pod_upload")}
          </button>
          <input ref={pickRef} type="file" accept="image/*" hidden onChange={upload} />
          {pod?.takenAt && <div className="text-[12px] text-[var(--muted)] mt-2 text-center">{t("pod_taken")} <bdi>{when(pod.takenAt)}</bdi></div>}
          {error && <div className="rr-error mt-3">{error}</div>}
        </div>

        <div className="dd-row">
          <CalendarDays size={22} className="text-[var(--muted)]" />
          <div className="flex-1 font-bold text-[var(--text)]">{t("delivered_on")}</div>
          <div className="text-[14px] text-[var(--text-2)]"><bdi>{when(pkg.deliveredAt || order?.updatedAt)}</bdi></div>
        </div>
      </div>
    </section>
  );
}
