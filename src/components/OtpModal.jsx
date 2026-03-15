// src/components/OtpModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Delete } from "lucide-react";
import { useTranslation } from "react-i18next";
import { backdrop, sheet } from "../lib/motion.js";

export default function OtpModal({ open, orderNo, onClose, onSubmit, loading = false, error = "" }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const maxLen = 4;

  useEffect(() => { if (!open) setCode(""); }, [open]);

  const digits = useMemo(() => {
    const arr = new Array(maxLen).fill("");
    return arr.map((_, i) => (code || "").split("")[i] || "");
  }, [code]);

  const push = (d) => { if (code.length < maxLen) setCode((s) => s + d); };
  const backspace = () => setCode((s) => s.slice(0, -1));
  const clear = () => setCode("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="otp-backdrop"
          variants={backdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-[120] bg-black/50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            key="otp-sheet"
            variants={sheet}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-white w-full max-w-[480px] rounded-t-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-[#DDDDDD] rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-[#DDDDDD]">
              <div className="font-semibold text-[#222222]">{t("enter_otp_for") || "Enter OTP"}</div>
              <button onClick={onClose} className="p-1.5 text-[#717171] rounded-full" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 pt-4 pb-8">
              <p className="text-sm text-[#717171] text-center">{t("enter_otp_for")}</p>
              <p className="text-base font-semibold text-[#222222] text-center mt-0.5 break-all">{orderNo}</p>

              {/* OTP boxes */}
              <div className="flex items-center justify-center gap-3 mt-5">
                {digits.map((d, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      borderColor: d ? "#FF385C" : "#DDDDDD",
                      backgroundColor: d ? "rgba(255,56,92,0.04)" : "#fff",
                      scale: d ? 1.04 : 1,
                    }}
                    transition={{ duration: 0.15 }}
                    className="w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold text-[#222222]"
                  >
                    {d || ""}
                  </motion.div>
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 text-center"
                >
                  {error}
                </motion.div>
              )}

              {/* Numpad */}
              <div className="mt-5 grid grid-cols-3 gap-2.5">
                {[1,2,3,4,5,6,7,8,9].map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => push(String(n))}
                    className="py-3.5 rounded-xl bg-[#F7F7F7] text-xl font-semibold text-[#222222] border border-[#DDDDDD]"
                  >
                    {n}
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={clear}
                  className="py-3.5 rounded-xl bg-[#F7F7F7] text-sm font-semibold text-[#717171] border border-[#DDDDDD]"
                >
                  {t("clear") || "Clear"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => push("0")}
                  className="py-3.5 rounded-xl bg-[#F7F7F7] text-xl font-semibold text-[#222222] border border-[#DDDDDD]"
                >
                  0
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={backspace}
                  className="py-3.5 rounded-xl bg-[#F7F7F7] border border-[#DDDDDD] flex items-center justify-center"
                >
                  <Delete size={20} className="text-[#717171]" />
                </motion.button>
              </div>

              {/* Actions */}
              <div className="mt-5 flex gap-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={onClose} className="btn-outline btn flex-1">
                  {t("cancel") || "Cancel"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSubmit?.(code)}
                  disabled={code.length < maxLen || loading}
                  className="btn-primary btn flex-1"
                >
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : (t("submit") || "Verify")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
