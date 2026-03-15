// src/components/LoginModal.jsx
import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginRequest } from "../lib/api.js";
import { decodeJwt } from "../lib/auth.js";
import { backdrop, sheet } from "../lib/motion.js";
import logoUrl from "/sh-logo.png";

function ModalContent({ onClose, onLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const data = await loginRequest(email, password);
      const payload = decodeJwt(data.token) || {};
      const auth = {
        token: data.token,
        role: data.role ?? payload.userType ?? null,
        warehouseId: data.warehouseId ?? null,
        userId: payload.user ?? null,
        email: payload.email ?? email,
        name: payload.name ?? null,
        userType: payload.userType ?? null,
        iat: payload.iat ?? null,
        exp: payload.exp ?? null,
      };
      onLogin?.(auth);
    } catch (err) {
      setError(err?.message || t("login_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="login-backdrop"
      variants={backdrop}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        key="login-sheet"
        variants={sheet}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#DDDDDD] rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="SHAHEENE" className="h-9 w-9 object-contain" />
              <span className="text-lg font-bold text-[#222222]">{t("brand")}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[#717171] hover:text-[#222222] rounded-full"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <h2 className="text-[22px] font-bold text-[#222222] mb-1">{t("login_title")}</h2>
          <p className="text-sm text-[#717171] mb-6">{t("login_subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={t("email_placeholder")}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#222222] mb-1.5">{t("password")}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder={t("password_placeholder")}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-3 flex items-center text-[#717171]"
                  aria-label={showPw ? t("hide_password") : t("show_password")}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary btn w-full mt-2"
            >
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : t("login_button")}
            </motion.button>

            <div className="text-center text-sm text-[#717171] pt-1">
              {t("forgot_password")}{" "}
              <button type="button" className="text-[#ffcc02] font-semibold">{t("reset_here")}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function LoginModal({ onClose, onLogin }) {
  const host = useMemo(() => {
    let el = document.getElementById("modal-root");
    if (!el) { el = document.createElement("div"); el.id = "modal-root"; document.body.appendChild(el); }
    return el;
  }, []);
  return createPortal(<ModalContent onClose={onClose} onLogin={onLogin} />, host);
}
