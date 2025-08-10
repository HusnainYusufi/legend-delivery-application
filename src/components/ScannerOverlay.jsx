import React from "react";
import { X } from "lucide-react";

export default function ScannerOverlay({ visible, onClose, scannerDivId, title }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/95 text-white">
      <div className="absolute inset-0">
        <div id={scannerDivId} className="h-full w-full" />
      </div>
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-3">
        <span className="font-semibold">{title}</span>
        <button onClick={onClose} className="btn btn-secondary bg-white/10 border-white/30 text-white">
          <X className="h-5 w-5" /> Close
        </button>
      </div>
    </div>
  );
}
