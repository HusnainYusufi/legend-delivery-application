import React from "react";
import { X } from "lucide-react";

export default function ScannerOverlay({ visible, onClose, scannerDivId, title }) {
  if (!visible) return null;
  return (
    <div className="scanner">
      <div className="absolute inset-0">
        <div id={scannerDivId} className="h-full w-full" />
      </div>
      <div className="scanner-toolbar">
        <span className="font-semibold">{title}</span>
        <button onClick={onClose} className="btn btn-secondary bg-white/10 border-white/30 text-white">
          <X className="h-5 w-5" /> Close
        </button>
      </div>
    </div>
  );
}
