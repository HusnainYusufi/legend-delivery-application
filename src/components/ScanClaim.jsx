// src/components/ScanClaim.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, QrCode, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
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
    if (!perm.granted) { setError(t("camera_permission_denied")); setScanOpen(false); return; }
    setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            await stopScanner();
            setScanOpen(false);
            const orderNo = parseOrderNumberFromScan(decoded);
            if (!orderNo) { setError("QR didn't contain an order number."); return; }
            try {
              setBusy(true);
              await claimPickupByOrderNo(orderNo);
              setToast({ type: "success", msg: t("claimed_success") || "Order claimed." });
              setTimeout(() => setToast(null), 2000);
            } catch (e) {
              setError(e?.message || "Claim failed");
            } finally { setBusy(false); }
          },
          (err) => { setError(err || t("camera_init_failed")); setScanOpen(false); }
        );
        scannerRef.current = s;
      } catch { setError(t("camera_init_failed")); setScanOpen(false); }
    }, 80);
  }, [scannerDivId, stopScanner, t]);

  useEffect(() => {
    if (scanOpen) beginScan();
    return () => { stopScanner(); };
  }, [scanOpen, beginScan, stopScanner]);

  return (
    <section className="view-animate">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#DDDDDD] bg-white">
        <button onClick={onBack} className="p-2 text-[var(--muted)] rounded-full hover:bg-[#F7F7F7]">
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-[17px] font-semibold text-[var(--text)]">
          {t("scan_product") || "Scan to Claim"}
        </h2>
      </div>

      {/* Hero */}
      <div className="px-4 pt-10 pb-6 text-center">
        <div className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(255,56,92,0.08)' }}>
          <QrCode size={40} className="text-[#FF385C]" />
        </div>
        <h3 className="text-[20px] font-bold text-[var(--text)] mb-2">
          {t("claim_any_order") || "Claim any order"}
        </h3>
        <p className="text-sm text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
          {t("scan_product_hint")}
        </p>

        <button
          onClick={() => { setScannerKey((k) => k + 1); setScanOpen(true); }}
          disabled={busy}
          className="btn-primary btn mt-8 w-full max-w-xs mx-auto"
        >
          {busy
            ? <Loader2 size={20} className="animate-spin" />
            : <Camera size={20} />}
          {t("open_camera") || "Open Camera"}
        </button>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 max-w-xs mx-auto">
            {error}
          </div>
        )}
      </div>

      <ScannerOverlay
        key={scannerKey}
        visible={scanOpen}
        onClose={async () => { await stopScanner(); setScanOpen(false); }}
        scannerDivId={scannerDivId}
        title={t("scan_to_claim") || "Scan to Claim"}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] rounded-full px-5 py-3 shadow-lg text-white flex items-center gap-2"
          style={{ background: 'linear-gradient(to right, #FF385C, #E31C5F)' }}>
          <CheckCircle size={18} />
          <span className="font-semibold text-sm">{toast.msg}</span>
        </div>
      )}
    </section>
  );
}
