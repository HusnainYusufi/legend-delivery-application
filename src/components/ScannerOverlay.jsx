import React from "react";
import { X } from "lucide-react";

export default function ScannerOverlay({ visible, onClose, scannerDivId, title }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <span className="font-semibold text-white text-base">{title}</span>
        <button 
          onClick={onClose} 
          className="btn bg-gradient-to-r from-slate-700 to-slate-800 text-white border border-slate-600 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div id={scannerDivId} className="w-full max-w-md h-80 rounded-xl overflow-hidden" />
      </div>
    </div>
  );
}