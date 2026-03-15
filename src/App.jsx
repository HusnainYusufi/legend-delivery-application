// src/App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera as CameraIcon, Loader2, QrCode, RefreshCcw, XCircle, LogIn, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import BottomTabBar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";
import ScannerOverlay from "./components/ScannerOverlay.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import LoginModal from "./components/LoginModal";
import OrdersList from "./components/OrdersList.jsx";
import ScanClaim from "./components/ScanClaim.jsx";
import Dashboard from "./components/Dashboard.jsx";

import { CONFIG, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import { ensureCameraPermission, startWebQrScanner, openAppSettings, scanImageFile } from "./lib/scanner.js";
import { getAuth as loadAuth, setAuth as persistAuth, clearAuth as purgeAuth } from "./lib/auth.js";
import { page as pageVariants } from "./lib/motion.js";
import logoUrl from "/sh-logo.png";

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
    const tm = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(tm);
  }, []);

  const [view, setView] = useState("home");

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [permDenied, setPermDenied] = useState(false);
  const [rawScan, setRawScan] = useState("");
  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";
  const [scannerKey, setScannerKey] = useState(0);

  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);

  const [auth, setAuthState] = useState(null);
  const isAuthenticated = !!auth?.token;
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const saved = loadAuth();
    if (saved?.token) { setAuthState(saved); setView("dashboard"); }
  }, []);

  const handleLogin = (authData) => {
    persistAuth(authData);
    setAuthState(authData);
    setIsLoginModalOpen(false);
    setView("dashboard");
    setToast({ type: "success", msg: "Logged in" });
    setTimeout(() => setToast(null), 2000);
  };

  const handleLogout = () => {
    purgeAuth();
    setAuthState(null);
    setView("home");
    setToast({ type: "success", msg: "Logged out" });
    setTimeout(() => setToast(null), 2000);
  };

  const stopScanner = useCallback(async () => {
    try { await scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    setScanError(""); setPermDenied(false);
    await stopScanner();
    const perm = await ensureCameraPermission();
    if (!perm.granted) { setPermDenied(true); setScanError(t("camera_permission_denied")); return; }
    setIsScanning(true);
    setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            const ord = parseOrderNumberFromScan(decoded);
            if (ord) setOrderNumber(ord);
            setRawScan(decoded);
            await stopScanner();
            setIsScanning(false);
          },
          (err) => { setScanError(err || t("camera_init_failed")); setIsScanning(false); }
        );
        scannerRef.current = s;
      } catch { setScanError(t("camera_init_failed")); setIsScanning(false); }
    }, 120);
  }, [stopScanner, t]);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  const getStatus = useCallback(async () => {
    if (!orderNumber) { setToast({ type: "error", msg: t("toast_need_order") }); return; }
    setIsLoading(true); setToast(null);
    try {
      const data = await apiFetch(CONFIG.paths.getStatus(orderNumber));
      setCurrent(data);
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") });
      setCurrent(null);
    } finally { setIsLoading(false); }
  }, [orderNumber, t]);

  const reset = useCallback(async () => {
    await stopScanner();
    setIsScanning(false); setScanError(""); setPermDenied(false);
    setRawScan(""); setCurrent(null); setOrderNumber("");
    setScannerKey((k) => k + 1);
  }, [stopScanner]);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await scanImageFile(
        file,
        (decoded) => {
          const ord = parseOrderNumberFromScan(decoded);
          if (ord) setOrderNumber(ord);
          setRawScan(decoded);
          setToast({ type: "success", msg: t("scanned_payload") + " ✓" });
        },
        (err) => setToast({ type: "error", msg: err || t("error_scan_image") })
      );
    } finally { e.target.value = ""; }
  };

  return (
    <div className="app-shell">
      <AnimatePresence>{showSplash && <Splash key="splash" />}</AnimatePresence>

      {/* Unauthenticated top bar */}
      {!isAuthenticated && (
        <div className="top-mini-bar">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="SHAHEENE" className="h-7 w-7 object-contain" />
            <span className="font-bold text-[15px] text-[#222222]">SHAHEENE</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-[#DDDDDD] rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#222222] bg-white outline-none"
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </select>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="btn-primary btn px-4 py-2 text-sm"
            >
              <LogIn size={16} />
              {t("login")}
            </button>
          </div>
        </div>
      )}

      {/* View container with AnimatePresence page transitions */}
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
              {/* Track order card */}
              <div className="card p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,204,2,0.08)" }}>
                    <QrCode size={20} className="text-[#ffcc02]" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[#222222]">{t("track_order")}</h2>
                    <p className="text-xs text-[#717171]">{t("scan_or_enter")}</p>
                  </div>
                </div>

                <input
                  className="input-field mb-3"
                  placeholder={t("placeholder_order")}
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                />

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button onClick={beginScan} className="btn-primary btn">
                    <CameraIcon size={18} /> {t("scan")}
                  </button>
                  <button onClick={reset} className="btn-outline btn">
                    <RefreshCcw size={18} />
                  </button>
                </div>

                <button onClick={getStatus} disabled={isLoading} className="btn-primary btn w-full">
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
                  {t("load_status")}
                </button>

                {scanError && (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <XCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      {scanError}
                      {permDenied && (
                        <button onClick={openAppSettings} className="ms-1 underline font-medium">{t("open_settings")}</button>
                      )}
                    </div>
                  </div>
                )}

                {rawScan && (
                  <div className="mt-3 p-3 bg-[#F7F7F7] rounded-xl">
                    <p className="text-xs text-[#717171]">{t("scanned_payload")}:</p>
                    <p className="text-sm font-mono break-words mt-1 text-[#222222]">{rawScan}</p>
                  </div>
                )}
              </div>

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
                    <StatusBadge value={current.currentStatus} />
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
              <OrdersList showDeliveredOnly />
            </motion.div>
          )}

          {view === "scan-claim" && (
            <motion.div key="scan-claim" variants={pageVariants} initial="hidden" animate="show" exit="exit">
              <ScanClaim onBack={() => setView("orders")} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      {isAuthenticated && (
        <BottomTabBar
          view={view}
          setView={setView}
          isDriver={isDriver}
          onLogout={handleLogout}
          language={language}
          onChangeLanguage={setLanguage}
        />
      )}

      {/* Login modal */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <LoginModal key="login" onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />
        )}
      </AnimatePresence>

      <ScannerOverlay
        key={scannerKey}
        visible={isScanning}
        onClose={async () => { await stopScanner(); setIsScanning(false); }}
        scannerDivId={scannerDivId}
        title={t("scan")}
      />

      {/* Toast — AnimatePresence for smooth enter/exit */}
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
