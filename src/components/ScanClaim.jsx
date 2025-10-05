// src/components/ScanClaim.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, QrCode, Loader2, ArrowLeft } from "lucide-react";
import ScannerOverlay from "./ScannerOverlay.jsx";
import { ensureCameraPermission, startWebQrScanner } from "../lib/scanner.js";
import { parseOrderNumberFromScan, claimPickupByOrderNo } from "../lib/api.js";

export default function ScanClaim({ onBack }) {
  const { t } = useTranslation();
  const [scanOpen, setScanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);
  const scannerDivId = "scan-claim-div";
  const [scannerKey, setScannerKey] = useState(0);

  const stopScanner = useCallback(async () => {
    try { await scannerRef.current?.stop?.(); } catch {}
    scannerRef.current = null;
  }, []);

  const beginScan = useCallback(async () => {
    const perm = await ensureCameraPermission();
    if (!perm.granted){ setError(t("camera_permission_denied")); setScanOpen(false); return; }
    setTimeout(async () => {
      try{
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            await stopScanner();
            setScanOpen(false);
            const orderNo = parseOrderNumberFromScan(decoded);
            if (!orderNo) { setError("QR didn’t contain an order number."); return; }
            try {
              setBusy(true);
              await claimPickupByOrderNo(orderNo);
              setToast({ type: "success", msg: t("claimed_success") || "Order claimed." });
              setTimeout(() => setToast(null), 1200);
            } catch (e) {
              setError(e?.message || "Claim failed");
            } finally {
              setBusy(false);
            }
          },
          (err) => { setError(err || t("camera_init_failed")); setScanOpen(false); }
        );
        scannerRef.current = s;
      }catch{
        setError(t("camera_init_failed"));
        setScanOpen(false);
      }
    }, 80);
  }, [scannerDivId, stopScanner, t]);

  useEffect(() => {
    if (scanOpen) beginScan();
    return () => { stopScanner(); };
  }, [scanOpen, beginScan, stopScanner]);

  return (
    <section className="card bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 mb-6 border border-slate-200 dark:border-slate-700 mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            className="icon-btn px-3 py-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t("scan_product") || "Scan Product"}
          </h2>
        </div>
        <button
          onClick={() => { setScannerKey(k=>k+1); setScanOpen(true); }}
          disabled={busy}
          className="btn brand-gradient text-white"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="ml-2">{t("open_camera") || "Open Camera"}</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-700/30 p-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center brand-gradient text-white shadow">
          <QrCode className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
          {t("claim_any_order") || "Claim any order by scanning"}
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("scan_product_hint") || "Point the camera at the package label QR. We’ll claim it to your account and it will appear in your Mine tab."}
        </p>

        <button
          onClick={() => { setScannerKey(k=>k+1); setScanOpen(true); }}
          disabled={busy}
          className="mt-6 btn brand-gradient text-white px-5 py-3"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="ml-2">{t("open_camera") || "Open Camera"}</span>
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Scanner overlay */}
      <ScannerOverlay
        key={scannerKey}
        visible={scanOpen}
        onClose={async () => { await stopScanner(); setScanOpen(false); }}
        scannerDivId={scannerDivId}
        title={t("scan_to_claim") || "Scan to Claim"}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] rounded-xl px-5 py-3 shadow-lg text-white ${toast.type==="success" ? "brand-gradient" : "bg-rose-600"}`}>
          <div className="font-medium text-sm">{toast.msg}</div>
        </div>
      )}
    </section>
  );
}
