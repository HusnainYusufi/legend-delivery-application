// src/components/OtpModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { X, Delete } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OtpModal({ open, orderNo, onClose, onSubmit, loading = false, error = "" }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const maxLen = 4;
  const sheetRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => { if (!open) setCode(""); }, [open]);

  useEffect(() => {
    if (open && sheetRef.current && backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(sheetRef.current, { y: "100%" }, { y: "0%", duration: 0.38, ease: "power3.out" });
    }
  }, [open]);

  const handleClose = () => {
    if (sheetRef.current && backdropRef.current) {
      gsap.to(sheetRef.current, { y: "100%", duration: 0.28, ease: "power2.in" });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.25, onComplete: onClose });
    } else {
      onClose?.();
    }
  };

  const digits = useMemo(() => {
    const arr = new Array(maxLen).fill("");
    const chars = (code || "").split("");
    return arr.map((_, i) => chars[i] || "");
  }, [code]);

  const push = (d) => { if (code.length < maxLen) setCode((s) => s + d); };
  const backspace = () => setCode((s) => s.slice(0, -1));
  const clear = () => setCode("");

  if (!open) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 z-[120] bg-black/50 modal-backdrop flex items-end justify-center">
      <div ref={sheetRef} className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl overflow-hidden">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#DDDDDD] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#DDDDDD]">
          <div className="font-semibold text-[#222222]">{t("enter_otp_for") || "Enter OTP"}</div>
          <button onClick={handleClose} className="p-1.5 text-[#717171] rounded-full" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-4 pb-8">
          <p className="text-sm text-[#717171] text-center">{t("enter_otp_for")}</p>
          <p className="text-base font-semibold text-[#222222] text-center mt-0.5 break-all">{orderNo}</p>

          {/* OTP boxes */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {digits.map((d, i) => (
              <div
                key={i}
                className="w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold text-[#222222]"
                style={{ borderColor: d ? "#FF385C" : "#DDDDDD", background: d ? "rgba(255,56,92,0.04)" : "#fff" }}
              >
                {d || ""}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Numpad */}
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button
                key={n}
                onClick={() => push(String(n))}
                className="py-3.5 rounded-xl bg-[#F7F7F7] text-xl font-semibold text-[#222222] border border-[#DDDDDD] active:bg-[#EEEEEE]"
              >
                {n}
              </button>
            ))}
            <button
              onClick={clear}
              className="py-3.5 rounded-xl bg-[#F7F7F7] text-sm font-semibold text-[#717171] border border-[#DDDDDD] active:bg-[#EEEEEE]"
            >
              {t("clear") || "Clear"}
            </button>
            <button
              onClick={() => push("0")}
              className="py-3.5 rounded-xl bg-[#F7F7F7] text-xl font-semibold text-[#222222] border border-[#DDDDDD] active:bg-[#EEEEEE]"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="py-3.5 rounded-xl bg-[#F7F7F7] border border-[#DDDDDD] active:bg-[#EEEEEE] flex items-center justify-center"
              aria-label={t("backspace")}
            >
              <Delete size={20} className="text-[#717171]" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            <button onClick={handleClose} className="btn-outline btn flex-1">
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={() => onSubmit?.(code)}
              disabled={code.length < maxLen || loading}
              className="btn-primary btn flex-1"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
                : (t("submit") || "Verify")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
