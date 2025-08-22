// src/components/LoginModal.jsx
import React, { useState } from "react";
import { X, User, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginRequest } from "../lib/api.js";
import { decodeJwt } from "../lib/auth.js";

export default function LoginModal({ onClose, onLogin }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await loginRequest(email, password);
      // Build the auth object we will store for later use
      const payload = decodeJwt(data.token) || {};
      const auth = {
        token: data.token,
        role: data.role ?? payload.userType ?? null,
        warehouseId: data.warehouseId ?? null,
        // helpful decoded fields (if present in JWT)
        userId: payload.user ?? null,
        email: payload.email ?? email,
        name: payload.name ?? null,
        userType: payload.userType ?? null,
        iat: payload.iat ?? null,
        exp: payload.exp ?? null,
      };

      onLogin?.(auth); // App will persist + update global state
      onClose?.();
    } catch (err) {
      setError(err?.message || t("login_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
          {t("login_title")}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-center mb-8">
          {t("login_subtitle")}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("email")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                placeholder={t("email_placeholder")}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t("password")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white pl-10 pr-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                placeholder={t("password_placeholder")}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 flex items-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="border-2 border-white border-t-transparent rounded-full w-5 h-5 animate-spin"></div>
            ) : (
              <Lock className="h-5 w-5" />
            )}
            {t("login_button")}
          </button>

          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("forgot_password")}
            <button type="button" className="text-indigo-600 dark:text-indigo-400 font-medium ml-1">
              {t("reset_here")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
