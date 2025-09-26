// src/components/AnimatedOtp.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2 } from "lucide-react";

/**
 * Animated 4-digit OTP sheet
 * Props:
 *  - open: boolean
 *  - orderNo: string
 *  - onClose: () => void
 *  - onVerify: (code: string) => void
 */
export default function AnimatedOtp({ open, orderNo, onClose, onVerify }) {
  const host = useMemo(() => {
    let el = document.getElementById("modal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "modal-root";
      document.body.appendChild(el);
    }
    return el;
  }, []);

  if (!open) return null;
  return createPortal(
    <Sheet orderNo={orderNo} onClose={onClose} onVerify={onVerify} />,
    host
  );
}

function Sheet({ orderNo, onClose, onVerify }) {
  const [code, setCode] = useState(["", "", "", ""]);
  const [visible, setVisible] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => setVisible(true), 15);
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    setCode((c) => {
      const next = [...c];
      next[i] = v;
      return next;
    });
    if (v && i < 3) inputsRef.current[i + 1]?.focus();
  };

  const onBackspace = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  };

  const value = code.join("");
  const ready = value.length === 4;

  return (
    <div className="fixed inset-0 z-[130]">
      {/* dim background */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 transition-transform duration-300 ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-md rounded-t-3xl bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              Enter OTP
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            For order: <span className="font-medium text-slate-800 dark:text-slate-200">{orderNo || "-"}</span>
          </div>

          {/* 4 digit boxes with subtle scale animation */}
          <div className="flex items-center justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((i) => {
              const filled = code[i] !== "";
              return (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  value={code[i]}
                  onChange={(e) => setDigit(i, e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => onBackspace(i, e)}
                  className={`w-14 h-16 text-center text-2xl font-bold rounded-2xl border outline-none transition
                    bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600
                    focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-900
                    ${filled ? "scale-105 shadow-sm" : "scale-100"}`}
                />
              );
            })}
          </div>

          {/* keypad-like quick digits */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button
                key={n}
                onClick={() => {
                  const idx = code.findIndex((d) => d === "");
                  if (idx !== -1) setDigit(idx, String(n));
                }}
                className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setCode(["", "", "", ""])}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const idx = code.findIndex((d) => d === "");
                if (idx !== -1) setDigit(idx, "0");
              }}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              0
            </button>
            <button
              onClick={() => {
                const lastIdx = code.slice().reverse().findIndex((d) => d !== "");
                const i = lastIdx === -1 ? -1 : 3 - lastIdx;
                if (i >= 0) setDigit(i, "");
                inputsRef.current[Math.max(0, i)]?.focus();
              }}
              className="py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              Backspace
            </button>
          </div>

          <button
            onClick={() => ready && onVerify?.(value)}
            disabled={!ready}
            className="mt-5 w-full btn text-white brand-gradient disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5" />
            Verify OTP
          </button>

          <div className="h-3" />
        </div>
      </div>
    </div>
  );
}
