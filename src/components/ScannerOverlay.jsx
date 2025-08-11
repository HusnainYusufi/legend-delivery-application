import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export default function ScannerOverlay({ visible, onClose, scannerDivId, title }) {
  const overlayRef = useRef(null);
  const [boxSize, setBoxSize] = useState(320); // square scan area

  // Lock body scroll when open
  useEffect(() => {
    if (visible) document.body.classList.add("scanner-open");
    else document.body.classList.remove("scanner-open");
    return () => document.body.classList.remove("scanner-open");
  }, [visible]);

  // Make the scan area square and responsive to viewport
  useEffect(() => {
    if (!visible) return;
    const recalc = () => {
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      const size = Math.floor(Math.min(vw, vh) * 0.9); // 90% of the shortest side
      setBoxSize(Math.max(220, Math.min(size, 480)));  // clamp between 220 and 480
    };
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
    >
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <span className="font-semibold text-white text-base">{title}</span>
        <button
          onClick={onClose}
          className="btn bg-white/10 border border-white/30 text-white px-3 py-1.5 rounded-lg text-sm"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {/* Square mount area for html5-qrcode */}
        <div
          id={scannerDivId}
          style={{ width: boxSize, height: boxSize }}
          className="rounded-xl overflow-hidden shadow-2xl"
        />
      </div>

      <div className="text-center text-white text-sm pb-6">
        Point camera at the QR code
      </div>
    </div>
  );
}
