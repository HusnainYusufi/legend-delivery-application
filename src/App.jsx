// src/App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, RefreshCcw, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import BottomTabBar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import { LoginScreen } from "./components/LoginModal";
import OrdersList from "./components/OrdersList.jsx";
import ScanClaim from "./components/ScanClaim.jsx";
import Dashboard from "./components/Dashboard.jsx";
import ReviewsRewards from "./components/rr/ReviewsRewards.jsx";
import ClaimRewards from "./components/rr/ClaimRewards.jsx";
import UploadReview from "./components/rr/UploadReview.jsx";
import DeliveredDetails from "./components/rr/DeliveredDetails.jsx";
import ReviewNotice from "./components/rr/ReviewNotice.jsx";

import { CONFIG, apiFetch, AUTH_EXPIRED_EVENT } from "./lib/api.js";
import { getAuth as loadAuth, setAuth as persistAuth, clearAuth as purgeAuth } from "./lib/auth.js";
import { page as pageVariants } from "./lib/motion.js";

export default function App() {
  const { t, i18n } = useTranslation();

  const [language, setLanguage] = useState("ar");
  useEffect(() => {
    if (language !== i18n.language) i18n.changeLanguage(language);
    const isRtl = language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language, i18n]);

  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const tm = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(tm);
  }, []);

  // Signed-in users start on their dashboard; nobody else gets past the login screen.
  const [view, setView] = useState("dashboard");
  // The delivered parcel an inner screen (Order Details / Upload a Review) is about.
  const [subject, setSubject] = useState(null);
  // Inner screens light up their parent tab; the 5 tabs themselves don't change.
  const NAV_PARENT = { rewards: "dashboard", claim: "dashboard", "review-upload": "delivered", "delivered-details": "delivered" };

  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);

  // Read the saved session before the first render, so the login screen never
  // flashes for someone who is already signed in (expired sessions read as null).
  const [auth, setAuthState] = useState(() => loadAuth());
  const isAuthenticated = !!auth?.token;
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";

  const toastTimer = useRef(null);

  const showToast = (type, msg, duration = 2000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // The server rejected our token (expired / revoked): back to the login screen.
  useEffect(() => {
    const onExpired = () => {
      setAuthState(null);
      setView("dashboard");
      showToast("error", t("session_expired"), 3000);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (authData) => {
    persistAuth(authData);
    setAuthState(authData);
    setView("dashboard");
    showToast("success", "Logged in");
  };

  const handleLogout = () => {
    purgeAuth();
    setAuthState(null);
    setView("dashboard");
    showToast("success", "Logged out");
  };

  const getStatus = useCallback(async () => {
    const no = orderNumber.trim();
    if (!no) { setToast({ type: "error", msg: t("toast_need_order") }); return; }
    setIsLoading(true); setToast(null);
    try {
      const data = await apiFetch(CONFIG.paths.getStatus(no));
      setCurrent(data);
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") });
      setCurrent(null);
    } finally { setIsLoading(false); }
  }, [orderNumber, t]);

  const reset = () => { setCurrent(null); setOrderNumber(""); };


  return (
    <div className="app-shell">
      <AnimatePresence>{showSplash && <Splash key="splash" />}</AnimatePresence>

      {/* Nothing but the login screen until someone signs in */}
      {!isAuthenticated && (
        <LoginScreen onLogin={handleLogin} language={language} onChangeLanguage={setLanguage} />
      )}

      {/* View container with AnimatePresence page transitions */}
      {isAuthenticated && (
      <main className="content">
        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="px-4 pt-6"
            >
              {/* Track order card: search by order number */}
              <form
                className="card p-5 mb-4"
                onSubmit={(e) => { e.preventDefault(); getStatus(); }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,204,2,0.08)" }}>
                    <Search size={20} className="text-[#ffcc02]" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[#222222]">{t("track_order")}</h2>
                    <p className="text-xs text-[#717171]">{t("track_enter_order")}</p>
                  </div>
                </div>

                <input
                  className="input-field mb-3"
                  placeholder={t("placeholder_order")}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  inputMode="text"
                  enterKeyHint="search"
                  autoComplete="off"
                />

                <div className="flex gap-3">
                  <button type="submit" disabled={isLoading} className="btn-primary btn flex-1">
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    {t("track_search")}
                  </button>
                  <button type="button" onClick={reset} className="btn-outline btn" aria-label={t("clear")}>
                    <RefreshCcw size={18} />
                  </button>
                </div>
              </form>

              {current && (
                <motion.div
                  className="card p-5"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 260 }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3 pb-3 border-b border-[#DDDDDD]">
                    <div>
                      <h2 className="text-[17px] font-bold text-[#222222]">{t("order_details")}</h2>
                      <p className="text-sm text-[#717171] mt-1">
                        {t("order")}: <span className="font-semibold text-[#222222]">{current.orderNo}</span>
                      </p>
                      <p className="text-sm text-[#717171]">
                        {t("tracking_number")}: <span className="font-semibold text-[#222222]">{current.trackingNumber}</span>
                      </p>
                    </div>
                    <StatusBadge value={current.currentStatus} manual={!!current.deliveredManually} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {view === "dashboard" && (
            <motion.div key="dashboard" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <Dashboard
                isDriver={isDriver}
                onTrackOrder={() => setView("home")}
                onOrders={() => setView("orders")}
                onDelivered={() => setView("delivered")}
                onRewards={() => setView("rewards")}
                onScanClaim={() => setView("scan-claim")}
              />
            </motion.div>
          )}

          {view === "orders" && (
            <motion.div key="orders" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <OrdersList />
            </motion.div>
          )}

          {view === "delivered" && (
            <motion.div key="delivered" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <OrdersList
                showDeliveredOnly
                onBack={() => setView("dashboard")}
                onOpenDetails={(o) => { setSubject(o); setView("delivered-details"); }}
                onUploadReview={(o) => { setSubject(o); setView("review-upload"); }}
              />
            </motion.div>
          )}

          {view === "rewards" && (
            <motion.div key="rewards" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <ReviewsRewards onBack={() => setView("dashboard")} onClaim={() => setView("claim")} />
            </motion.div>
          )}

          {view === "claim" && (
            <motion.div key="claim" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <ClaimRewards onBack={() => setView("rewards")} toast={showToast} />
            </motion.div>
          )}

          {view === "review-upload" && subject && (
            <motion.div key="review-upload" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <UploadReview order={subject} toast={showToast} onBack={() => setView("delivered")} onSubmitted={() => setView("delivered")} />
            </motion.div>
          )}

          {view === "delivered-details" && subject && (
            <motion.div key="delivered-details" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <DeliveredDetails order={subject} toast={showToast} onBack={() => setView("delivered")} />
            </motion.div>
          )}

          {view === "scan-claim" && (
            <motion.div key="scan-claim" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <ScanClaim onBack={() => setView("orders")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      )}

      {/* Bottom tab bar */}
      {isAuthenticated && (
        <BottomTabBar
          view={NAV_PARENT[view] || view}
          setView={setView}
          isDriver={isDriver}
          onLogout={handleLogout}
          language={language}
          onChangeLanguage={setLanguage}
        />
      )}

      {/* Toast — AnimatePresence for smooth enter/exit */}
      {isAuthenticated && (
        <ReviewNotice
          onOpenRewards={() => setView("rewards")}
          onReupload={() => setView("delivered")}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 20, stiffness: 300 } }}
            exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full px-5 py-3 shadow-lg flex items-center gap-2 text-sm font-semibold"
            style={{
              background: toast.type === "success" ? "linear-gradient(to right, #ffcc02, #e6b800)" : "#C13515",
              color: toast.type === "success" ? "#1A1A1A" : "#fff",
            }}
          >
            <CheckCircle size={16} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
