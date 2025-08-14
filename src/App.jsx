import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, QrCode, RefreshCcw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";
import ScannerOverlay from "./components/ScannerOverlay.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import Sidebar from "./components/Sidebar";
import LoginModal from "./components/LoginModal";

import { CONFIG, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import {
  ensureCameraPermission,
  startWebQrScanner,
  openAppSettings,
  scanImageFile,
} from "./lib/scanner.js";

export default function App() {
  const { t, i18n } = useTranslation();

  // UI prefs
  const [language, setLanguage] = useState("ar");
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Splash
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const tm = setTimeout(() => setShowSplash(false), 900);
    return () => clearTimeout(tm);
  }, []);

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [permDenied, setPermDenied] = useState(false);
  const [rawScan, setRawScan] = useState("");

  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";
  const [scannerKey, setScannerKey] = useState(0); // force overlay remount for clean init

  // Order/status state
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Stop any active scanner instance
  const stopScanner = useCallback(async () => {
    try {
      await scannerRef.current?.stop?.();
    } catch {}
    scannerRef.current = null;
  }, []);

  // Begin scanning flow
  const beginScan = useCallback(async () => {
    setScanError("");
    setPermDenied(false);
    await stopScanner(); // ensure no leftover instance

    const perm = await ensureCameraPermission();
    if (!perm.granted) {
      setPermDenied(true);
      setScanError(t("camera_permission_denied"));
      return;
    }

    // Show overlay first so the mount div exists
    setIsScanning(true);

    // Start scanner after overlay mounts
    setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          (decoded) => {
            const ord = parseOrderNumberFromScan(decoded);
            if (ord) setOrderNumber(ord);
            setRawScan(decoded);
            setIsScanning(false);
          },
          (err) => {
            setScanError(err || t("camera_init_failed"));
            setIsScanning(false);
          }
        );
        scannerRef.current = s;
      } catch {
        setScanError(t("camera_init_failed"));
        setIsScanning(false);
      }
    }, 120);
  }, [stopScanner, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // Fetch status
  const getStatus = useCallback(async () => {
    if (!orderNumber) {
      setToast({ type: "error", msg: t("toast_need_order") });
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const data = await apiFetch(CONFIG.paths.getStatus(orderNumber));
      setCurrent(data);
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") });
      setCurrent(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber, t]);

  // Hard reset: stop scanner, clear state, and force clean overlay next time
  const reset = useCallback(async () => {
    await stopScanner();
    setIsScanning(false);
    setScanError("");
    setPermDenied(false);
    setRawScan("");
    setCurrent(null);
    setOrderNumber("");
    setScannerKey((k) => k + 1); // force <ScannerOverlay> to remount fresh
  }, [stopScanner]);

  // Language change
  useEffect(() => {
    if (language !== i18n.language) i18n.changeLanguage(language);
  }, [language, i18n]);

  // Scan from image fallback
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
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="app-shell min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
      {showSplash && <Splash />}
      
      {/* Added Sidebar */}
      <Sidebar 
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      <Navbar
        language={language}
        onChangeLanguage={setLanguage}
        onScan={beginScan}
        onPickImage={onPickImage}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        isAuthenticated={isAuthenticated}
      />

      {/* Added login modal */}
      {isLoginModalOpen && (
        <LoginModal 
          onClose={() => setIsLoginModalOpen(false)} 
          onLogin={handleLogin}
        />
      )}

      {/* Updated main content with left margin */}
      <main className="content safe-b max-w-3xl mx-auto px-4 pt-20 pb-6 ml-16 md:ml-20">
        {/* Scanner + input card */}
        <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("track_order")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("scan_or_enter")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t("order_number")}
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                placeholder={t("placeholder_order")}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                inputMode="text"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={beginScan}
                className="btn bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white flex items-center justify-center gap-2"
              >
                <CameraIcon className="h-5 w-5" /> {t("scan")}
              </button>

              <button
                onClick={reset}
                className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
              >
                <RefreshCcw className="h-5 w-5 mx-auto" />
              </button>
            </div>

            <button
              onClick={getStatus}
              disabled={isLoading}
              className="btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              {t("load_status")}
            </button>
          </div>

          {!!scanError && (
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200 flex items-start">
              <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                {scanError}
                {permDenied && (
                  <button onClick={openAppSettings} className="ml-2 underline font-medium">
                    {t("open_settings")}
                  </button>
                )}
              </div>
            </div>
          )}

          {!!rawScan && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-xs text-slate-500 dark:text-slate-400">{t("scanned_payload")}:</p>
              <p className="text-sm font-mono break-words mt-1 text-slate-700 dark:text-slate-300">{rawScan}</p>
            </div>
          )}
        </section>

        {/* Order details (matches your server response shape) */}
        {current && (
          <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("order_details")}</h2>
                <div className="mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t("order")}: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                    {current.orderNo}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t("tracking_number")}: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">
                    {current.trackingNumber}
                  </span>
                </div>
              </div>
              <StatusBadge value={current.currentStatus} />
            </div>

            {/* Status steps */}
            {Array.isArray(current.steps) && current.steps.length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {t("order_steps")}
                </h3>
                <div className="space-y-2">
                  {current.steps.map((step) => {
                    const isCurrent = step.current;
                    const isDone = step.done;
                    const isNextSuggested = (current.nextAllowed || []).includes(step.code) && !isDone;

                    let stepClass = "bg-slate-50 dark:bg-slate-700/30";
                    let textClass = "text-slate-800 dark:text-slate-200";
                    let borderClass = "border-slate-200 dark:border-slate-700";

                    if (isDone) {
                      stepClass = "bg-green-50 dark:bg-green-900/20";
                      textClass = "text-green-700 dark:text-green-300";
                      borderClass = "border-green-200 dark:border-green-800";
                    } else if (isCurrent) {
                      stepClass = "bg-blue-50 dark:bg-blue-900/20";
                      textClass = "text-blue-700 dark:text-blue-300";
                      borderClass = "border-blue-200 dark:border-blue-800";
                    } else if (isNextSuggested) {
                      stepClass = "bg-amber-50 dark:bg-amber-900/20";
                      textClass = "text-amber-700 dark:text-amber-300";
                      borderClass = "border-amber-200 dark:border-amber-800";
                    }

                    return (
                      <div key={step.code} className={`p-3 rounded-lg border ${borderClass} ${stepClass} flex items-center gap-3`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDone ? "bg-green-500 text-white" : "bg-slate-200 dark:bg-slate-600"}`}>
                          {isDone ? "✓" : (step.code || "?").charAt(0)}
                        </div>
                        <div className={`flex-1 ${textClass}`}>
                          <div className="font-medium">{t(`statuses.${step.code}`)}</div>
                          {step.at && <div className="text-xs mt-1">{new Date(step.at).toLocaleString()}</div>}
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                            {t("current")}
                          </span>
                        )}
                        {isNextSuggested && !isCurrent && (
                          <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded">
                            {t("next_suggested")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special statuses */}
            {Array.isArray(current.special) && current.special.length > 0 && (
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {t("special_statuses")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {current.special.map((status) => (
                    <div
                      key={status.code}
                      className={`p-3 rounded-lg border ${
                        status.occurred
                          ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="font-medium">
                        {t(`statuses.${status.code}`)}
                        {status.occurred && (
                          <span className="ml-2 text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            {t("occurred")}
                          </span>
                        )}
                      </div>
                      {status.at && <div className="text-xs mt-1">{new Date(status.at).toLocaleString()}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 rounded-xl px-5 py-3 shadow-lg flex items-center transition-all ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
            }`}
          >
            <div className="font-medium text-sm">{toast.msg}</div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 text-center mt-4">
          {t("tip_camera")}
        </p>
      </main>

      {/* Scanner overlay. Key changes: 
          1) square responsive mount handled in component,
          2) key={scannerKey} forces clean remount after reset */}
      <ScannerOverlay
        key={scannerKey}
        visible={isScanning}
        onClose={async () => {
          await stopScanner();
          setIsScanning(false);
        }}
        scannerDivId={scannerDivId}
        title={t("scan")}
      />
    </div>
  );
}