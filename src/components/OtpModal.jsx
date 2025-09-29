// src/components/OtpModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Delete, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OtpModal({ open, orderNo, onClose, onSubmit, digits = 4 }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");

  useEffect(() => { if (!open) setCode(""); }, [open]);

  const boxes = useMemo(() => {
    const arr = new Array(digits).fill("");
    const chars = (code || "").split("");
    return arr.map((_, i) => chars[i] || "");
  }, [code, digits]);

  const push = (d) => { if (code.length < digits) setCode((s) => s + d); };
  const backspace = () => setCode((s) => s.slice(0, -1));
  const clear = () => setCode("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        {/* header */}
        <div className="brand-gradient px-4 py-3 text-white flex items-center justify-between">
          <div className="font-semibold text-sm">SHAHEENE</div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* body */}
        <div className="p-5">
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t("enter_otp_for") || "Enter OTP for Order"}
            </div>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1 break-all">
              {orderNo}
            </div>
          </div>

          {/* boxes */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {boxes.map((d, i) => (
              <div
                key={i}
                className="w-12 h-14 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xl font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all"
                style={{ transform: d ? "scale(1.02)" : "scale(1)" }}
              >
                {d || ""}
              </div>
            ))}
          </div>

          {/* keypad */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button
                key={n}
                onClick={() => push(String(n))}
                className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition"
              >
                {n}
              </button>
            ))}
            <button
              onClick={clear}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              {t("clear")}
            </button>
            <button
              onClick={() => push("0")}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              0
            </button>
            <button
              onClick={backspace}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center"
              aria-label={t("backspace")}
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          {/* actions */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 btn border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => onSubmit?.(code)}
              disabled={code.length < digits}
              className="flex-1 btn text-white brand-gradient disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="h-5 w-5" />
              {t("submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
