import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, QrCode, RefreshCcw, Edit3, XCircle, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./components/Header.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import Splash from "./components/Splash.jsx";
import { CONFIG, DEFAULT_MOCK_MODE, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import { mockApplyStatus, mockGetOrder } from "./lib/mock.js";
import { ensureCameraPermission, startWebQrScanner } from "./lib/scanner.js";

export default function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [showSplash, setShowSplash] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [rawScan, setRawScan] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);
  const [newStatus, setNewStatus] = useState(CONFIG.statuses[0]);
  const [useMock, setUseMock] = useState(DEFAULT_MOCK_MODE);

  // Splash: keep for a short, nice entrance
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  // Web QR scanner instance management
  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current?.stop) await scannerRef.current.stop();
    } catch {}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    setScanError("");
    setRawScan("");
    // Ask for camera permission using Capacitor Camera so WebView getUserMedia will be allowed
    const ok = await ensureCameraPermission();
    if (!ok) {
      setScanError("Camera permission denied. Enable it in Settings.");
      return;
    }
    setIsScanning(true);
    // start web scanner
    scannerRef.current = await startWebQrScanner(
      scannerDivId,
      (decoded) => {
        const ord = parseOrderNumberFromScan(decoded);
        if (ord) setOrderNumber(ord);
        setRawScan(decoded);
        setIsScanning(false);
      },
      (err) => {
        setScanError(err || "Camera failed to start.");
        setIsScanning(false);
      }
    );
  }, []);

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const getStatus = useCallback(async () => {
    if (!orderNumber) { setToast({ type: "error", msg: t("toast_need_order") }); return; }
    setIsLoading(true); setToast(null);
    try {
      const data = useMock ? await mockGetOrder(orderNumber) : await apiFetch(CONFIG.paths.getStatus(orderNumber));
      setCurrent(data);
      if (data?.status && CONFIG.statuses.includes(String(data.status))) setNewStatus(String(data.status));
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") });
      setCurrent(null);
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

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-sky-50 to-sky-100 text-slate-900">
      {showSplash && <Splash />}

      <div className="w-full px-4 pt-4 pb-6 safe-b max-w-md mx-auto">
        <Header
          useMock={useMock}
          onToggleMock={() => setUseMock((v) => !v)}
          language={language}
          onChangeLanguage={setLanguage}
        />

        <div className="card border-sky-200 p-4">
          <div className="text-sm text-slate-600 mb-2">{t("scan_or_enter")}</div>

          {/* Input + actions: stack on mobiles, tidy on tablets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              className="sm:col-span-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none ring-0 focus:border-slate-400"
              placeholder={t("placeholder_order")}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              inputMode="text"
              autoComplete="off"
            />
            <button onClick={beginScan} className="btn btn-secondary">
              <CameraIcon className="h-5 w-5" /> {t("scan")}
            </button>
            <button onClick={reset} className="btn btn-secondary" title={t("reset")}>
              <RefreshCcw className="h-5 w-5" /> {t("reset")}
            </button>
            <button onClick={getStatus} disabled={isLoading} className="btn btn-primary sm:col-span-3">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <QrCode className="h-5 w-5" />}
              {t("load_status")}
            </button>
          </div>

          {!!scanError && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <XCircle className="h-4 w-4" /> {scanError}
            </p>
          )}
          {!!rawScan && (
            <p className="mt-2 text-xs text-slate-500 break-words">
              {t("scanned_payload")}: <span className="font-mono">{rawScan}</span>
            </p>
          )}

          {current && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-sky-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">{t("order")}</div>
                  <div className="font-semibold break-words">{current.orderNumber || orderNumber}</div>
                </div>
                <StatusBadge value={current.status} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-200 bg-white p-3">
                  <div className="text-xs text-slate-500">{t("customer")}</div>
                  <div className="text-sm font-medium break-words">{current?.customer?.name || "—"}</div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-white p-3">
                  <div className="text-xs text-slate-500">{t("last_updated")}</div>
                  <div className="text-sm font-medium">{current?.lastUpdated ? new Date(current.lastUpdated).toLocaleString() : "—"}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <label className="text-sm text-slate-700 sm:col-span-1">{t("new_status")}</label>
                <select
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm sm:col-span-1"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {CONFIG.statuses.map((s) => (
                    <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                  ))}
                </select>
                <button onClick={applyStatus} disabled={isApplying} className="btn btn-primary sm:col-span-1">
                  {isApplying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Edit3 className="h-5 w-5" />}
                  {t("apply_status")}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">{t("tip_camera")}</p>
      </div>

      {/* Full-screen scanner overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/95 text-white">
          <div className="absolute inset-0">
            <div id={scannerDivId} className="h-full w-full" />
          </div>
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-3">
            <span className="font-semibold">{t("scan")}</span>
            <button onClick={() => { setIsScanning(false); stopScanner(); }} className="btn btn-secondary bg-white/10 border-white/30 text-white">
              <X className="h-5 w-5" /> {t("stop")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
