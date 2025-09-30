// src/components/DeliverySuccess.jsx
import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function DeliverySuccess({ open, onClose, orderNo }) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80">
      <div className="text-center text-white px-6">
        <div className="mx-auto w-24 h-24 rounded-full bg-white/10 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-14 h-14 text-emerald-400" />
        </div>
        <div className="mt-6 text-3xl font-extrabold">Hurray! Delivered 🎉</div>
        {orderNo && (
          <div className="mt-2 text-sm opacity-90">Order #{orderNo}</div>
        )}
        <div className="mt-6">
          <button
            onClick={() => { setVisible(false); onClose?.(); }}
            className="px-5 py-2 rounded-xl bg-white text-slate-800 font-medium shadow"
          >
            Done
          </button>
        </div>
        {/* simple confetti-ish dots */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 bg-white/70 rounded-full"
              style={{
                left: `${Math.random()*100}%`,
                top: `${Math.random()*100}%`,
                animation: `float ${2 + Math.random()*2}s ease-in-out ${Math.random()}s infinite alternate`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes float {
            from { transform: translateY(0px); opacity: .7; }
            to   { transform: translateY(-18px) scale(1.06); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
