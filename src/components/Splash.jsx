import React from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function Splash() {
  const { t } = useTranslation();

  const roadDuration = 0.55;
  const truckDelay = 0.25;
  const truckDuration = 0.8;

  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-col items-center w-[84%] max-w-md">
        {/* Logo tile */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="h-20 w-20 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-xl"
        >
          <div className="w-16 h-16 rounded-xl overflow-hidden grid place-items-center">
            <img
              src="/sh-logo.png"
              alt="SHAHEENE"
              className="w-14 h-14 object-contain"
            />
          </div>
        </motion.div>

        {/* Brand & tagline */}
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.08 }}
          className="text-2xl font-extrabold text-white tracking-tight"
        >
          {t("brand")}
        </motion.div>
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.14 }}
          className="mt-1 text-sm text-white/80"
        >
          {t("splash_tagline")}
        </motion.div>

        {/* Road + truck */}
        <div className="w-full mt-8">
          <motion.div
            className="road"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: roadDuration, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left center" }}
          >
            <motion.div
              className="road-centerline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.2 }}
            />
            {/* Truck (logo) driving */}
            <motion.img
              src="/sh-logo.png"
              alt="Truck"
              className="absolute -top-7 w-10 h-10 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)]"
              initial={{ x: "-48vw", rotate: -1.5, opacity: 0.95 }}
              animate={{ x: "48vw", rotate: 0, opacity: 1 }}
              transition={{ delay: truckDelay, duration: truckDuration, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
