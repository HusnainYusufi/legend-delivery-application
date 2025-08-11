import React from "react";
import { X } from "lucide-react";

export default function ScannerOverlay({ visible, onClose, scannerDivId, title }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm">
      <div className="absolute inset-0 md:inset-10 lg:inset-20">
        <div id={scannerDivId} className="h-full w-full rounded-xl overflow-hidden" />
      </div>
      <div className="scanner-toolbar absolute top-4 left-4 right-4 flex items-center justify-between">
        <span className="font-semibold text-white text-lg">{title}</span>
        <button 
          onClick={onClose} 
          className="btn bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600 flex items-center gap-2"
        >
          <X className="h-5 w-5" /> Close
        </button>
      </div>
    </div>
  );
}