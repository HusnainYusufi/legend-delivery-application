// App.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, QrCode, RefreshCcw, Edit3, XCircle, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";
import ScannerOverlay from "./components/ScannerOverlay.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import { CONFIG, DEFAULT_MOCK_MODE, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import { mockApplyStatus, mockGetOrder } from "./lib/mock.js";
import { ensureCameraPermission, startWebQrScanner, openAppSettings, scanImageFile } from "./lib/scanner.js";

export default function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Splash
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const tm = setTimeout(() => setShowSplash(false), 900); return () => clearTimeout(tm); }, []);

  // State
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [permDenied, setPermDenied] = useState(false);
  const [rawScan, setRawScan] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);
  const [newStatus, setNewStatus] = useState(CONFIG.statuses[0]);
  const [useMock, setUseMock] = useState(DEFAULT_MOCK_MODE);

  // Scanner
  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";

  const stopScanner = useCallback(async () => {
    try { await scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    setScanError(""); setRawScan(""); setPermDenied(false);
    const perm = await ensureCameraPermission();
    if (!perm.granted) {
      setPermDenied(true);
      setScanError("Camera permission denied. Tap 'Open Settings' and allow Camera.");
      return;
    }
    setIsScanning(true);
    scannerRef.current = await startWebQrScanner(
      scannerDivId,
      (decoded) => {
        const ord = parseOrderNumberFromScan(decoded);
        if (ord) setOrderNumber(ord);
        setRawScan(decoded);
        setIsScanning(false);
      },
      (err) => { setScanError(err || "Camera failed to start."); setIsScanning(false); }
    );
  }, []);

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  // API
  const getStatus = useCallback(async () => {
    if (!orderNumber) { setToast({ type: "error", msg: t("toast_need_order") }); return; }
    setIsLoading(true); setToast(null);
    try {
      const data = useMock ? await mockGetOrder(orderNumber) : await apiFetch(CONFIG.paths.getStatus(orderNumber));
      setCurrent(data);
      if (data?.status && CONFIG.statuses.includes(String(data.status))) setNewStatus(String(data.status));
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") }); setCurrent(null);
    } finally { setIsLoading(false); }
  }, [orderNumber, useMock, t]);

  const applyStatus = useCallback(async () => {
    if (!orderNumber) { setToast({ type: "error", msg: t("toast_need_order") }); return; }
    if (!newStatus) return;
    setIsApplying(true); setToast(null);
    try {
      const data = useMock
        ? await mockApplyStatus(orderNumber, newStatus)
        : await apiFetch(CONFIG.paths.applyStatus(orderNumber), { method: "POST", body: JSON.stringify({ status: newStatus }) });
      setToast({ type: "success", msg: t("toast_set_status", { status: t(`statuses.${newStatus}`) }) });
      setCurrent((prev) => ({ ...(prev || {}), status: newStatus, lastUpdated: data?.lastUpdated || new Date().toISOString() }));
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_apply_status") });
    } finally { setIsApplying(false); }
  }, [orderNumber, newStatus, useMock, t]);

  const reset = () => { setOrderNumber(""); setRawScan(""); setCurrent(null); };
  useEffect(() => { if (language !== i18n.language) i18n.changeLanguage(language); }, [language, i18n]);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await scanImageFile(
      file,
      (decoded) => {
        const ord = parseOrderNumberFromScan(decoded);
        if (ord) setOrderNumber(ord);
        setRawScan(decoded);
        setToast({ type: "success", msg: t("scanned_payload") + " ✓" });
      },
      (err) => setToast({ type: "error", msg: err || "Could not read QR from image." })
    );
    e.target.value = "";
  };

  return (
    <div className="app-shell min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-slate-900 dark:to-slate-800">
      {showSplash && <Splash />}

      {/* Fixed top navbar with solid background and shadow */}
      <Navbar
        language={language}
        onChangeLanguage={setLanguage}
        onScan={beginScan}
        onPickImage={onPickImage}
        useMock={useMock}
        onToggleMock={() => setUseMock(v => !v)}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Content area below navbar */}
      <main className="content safe-b max-w-3xl mx-auto px-4 pt-20">
        {/* Primary task card */}
        <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("track_order")}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t("scan_or_enter")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("order_number")}</label>
              <input
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                placeholder={t("placeholder_order")}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                inputMode="text"
                autoComplete="off"
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button 
                onClick={beginScan} 
                className="flex-1 btn bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white flex items-center justify-center gap-2"
              >
                <CameraIcon className="h-5 w-5" /> <span className="hidden sm:inline">{t("scan")}</span>
              </button>

              <button 
                onClick={reset} 
                className="btn bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600"
                title={t("reset")}
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            </div>

            <button 
              onClick={getStatus} 
              disabled={isLoading} 
              className="btn bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white sm:col-span-3 flex items-center justify-center gap-2"
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
                    Open Settings
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

        {/* Details / status card */}
        {current && (
          <section className="card bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t("order_details")}</h2>
                <div className="mt-1">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t("order")}: </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{current.orderNumber || orderNumber}</span>
                </div>
              </div>
              <StatusBadge value={current.status} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("customer")}</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 break-words mt-1">
                  {current?.customer?.name || "—"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t("last_updated")}</div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                  {current?.lastUpdated ? new Date(current.lastUpdated).toLocaleString() : "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-3">{t("update_status")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t("new_status")}</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 text-sm transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {CONFIG.statuses.map((s) => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button 
                    onClick={applyStatus} 
                    disabled={isApplying} 
                    className="w-full btn bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white flex items-center justify-center gap-2"
                  >
                    {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit3 className="h-5 w-5" />}
                    {t("apply_status")}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {toast && (
          <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 rounded-xl px-5 py-3 shadow-lg flex items-center transition-all ${
            toast.type === "success" 
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" 
              : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
          }`}>
            <div className="font-medium">{toast.msg}</div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 text-center mt-6">{t("tip_camera")}</p>
      </main>

      {/* Full-screen scanner */}
      <ScannerOverlay
        visible={isScanning}
        onClose={() => { setIsScanning(false); stopScanner(); }}
        scannerDivId={scannerDivId}
        title={t("scan")}
      />
    </div>
  );
}