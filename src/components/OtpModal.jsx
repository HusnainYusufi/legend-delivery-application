// src/components/OtpModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { X, Delete, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OtpModal({ open, orderNo, onClose, onSubmit, error, loading }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const maxLen = 4; // ✅ 4-digit OTP

  useEffect(() => {
    if (!open) setCode("");
  }, [open]);

  const digits = useMemo(() => {
    const arr = new Array(maxLen).fill("");
    const chars = (code || "").split("");
    return arr.map((_, i) => chars[i] || "");
  }, [code]);

  const push = (d) => {
    if (loading) return;
    if (code.length >= maxLen) return;
    setCode((s) => s + d);
  };
  const backspace = () => { if (!loading) setCode((s) => s.slice(0, -1)); };
  const clear = () => { if (!loading) setCode(""); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="brand-gradient px-4 py-3 text-white flex items-center justify-between">
          <div className="font-semibold text-sm">OTP Verification</div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {t("enter_otp_for")}
            </div>
            <div className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1 break-all">
              {orderNo}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            {digits.map((d, i) => (
              <div
                key={i}
                className="w-10 h-12 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center text-lg font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {d || ""}
              </div>
            ))}
          </div>

          {!!error && (
            <div className="mt-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button
                key={n}
                onClick={() => push(String(n))}
                disabled={loading}
                className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60"
              >
                {n}
              </button>
            ))}
            <button
              onClick={clear}
              disabled={loading}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60"
            >
              {t("clear")}
            </button>
            <button
              onClick={() => push("0")}
              disabled={loading}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60"
            >
              0
            </button>
            <button
              onClick={backspace}
              disabled={loading}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center disabled:opacity-60"
              aria-label={t("backspace")}
            >
              <Delete className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 btn border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() => onSubmit?.(code)}
              disabled={loading || code.length < 4}
              className="flex-1 btn text-white brand-gradient disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              {t("submit")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
