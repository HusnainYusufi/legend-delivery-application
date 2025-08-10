import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, QrCode, RefreshCcw, Edit3, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./components/Header.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import { CONFIG, DEFAULT_MOCK_MODE, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import { mockApplyStatus, mockGetOrder } from "./lib/mock.js";

export default function App() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
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

  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    let isActive = true;
    async function start() {
      setScanError("");
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const html5QrCode = new Html5Qrcode(scannerDivId, { verbose: false });
        scannerRef.current = html5QrCode;
        const config = { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.7778 };
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (!isActive) return;
            setRawScan(decodedText);
            const ord = parseOrderNumberFromScan(decodedText);
            if (ord) setOrderNumber(ord);
            setIsScanning(false);
          },
          () => {}
        );
      } catch (err) {
        setScanError((err && (err.message || String(err))) || "Camera initialization failed. Check permissions and HTTPS.");
        setIsScanning(false);
      }
    }
    if (isScanning) start();
    return () => { isActive = false; stopScanner(); };
  }, [isScanning, stopScanner]);

  const handleScanToggle = async () => {
    if (isScanning) { setIsScanning(false); await stopScanner(); }
    else { setRawScan(""); setScanError(""); setIsScanning(true); }
  };

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

  useEffect(() => {
    if (language !== i18n.language) i18n.changeLanguage(language);
  }, [language, i18n]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-50 to-sky-100 text-slate-900">
      <div className="mx-auto max-w-xl px-4 py-8">
        <Header
          useMock={useMock}
          onToggleMock={() => setUseMock((v) => !v)}
          language={language}
          onChangeLanguage={setLanguage}
        />

        <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-700">{t("scan_or_enter")}</label>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 focus:border-slate-400"
                placeholder={t("placeholder_order")}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                inputMode="text"
                autoComplete="off"
              />
              <button onClick={handleScanToggle} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm shadow-sm ${isScanning ? "border-red-200 bg-red-50 text-red-700" : "border-slate-300 bg-white hover:bg-slate-50"}`}>
                <Camera className="h-4 w-4" /> {isScanning ? t("stop") : t("scan")}
              </button>
              <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50">
                <RefreshCcw className="h-4 w-4" /> {t("reset")}
              </button>
            </div>

            {isScanning && (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div id={scannerDivId} className="aspect-video w-full bg-black/5" />
              </div>
            )}
            {!!scanError && (
              <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <XCircle className="h-4 w-4" /> {scanError}
              </p>
            )}
            {!!rawScan && (
              <p className="text-xs text-slate-500">{t("scanned_payload")}:
                <span className="font-mono"> {rawScan}</span>
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button onClick={getStatus} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              {t("load_status")}
            </button>
          </div>

          {current && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-sky-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-500">{t("order")}</div>
                  <div className="font-semibold">{current.orderNumber || orderNumber}</div>
                </div>
                <StatusBadge value={current.status} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-sky-200 bg-white p-3">
                  <div className="text-xs text-slate-500">{t("customer")}</div>
                  <div className="text-sm font-medium">{current?.customer?.name || "—"}</div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-white p-3">
                  <div className="text-xs text-slate-500">{t("last_updated")}</div>
                  <div className="text-sm font-medium">{current?.lastUpdated ? new Date(current.lastUpdated).toLocaleString() : "—"}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-700">{t("new_status")}</label>
                  <select
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {CONFIG.statuses.map((s) => (
                      <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                    ))}
                  </select>
                </div>
                <button onClick={applyStatus} disabled={isApplying} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-white shadow-sm disabled:opacity-60">
                  {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                  {t("apply_status")}
                </button>
              </div>
            </div>
          )}

          {toast && (
            <div className={`mt-4 inline-flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
              toast.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
            }`}>
              {toast.msg}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500">{t("tip_camera")}</p>
      </div>
    </div>
  );
}
