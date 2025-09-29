import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera as CameraIcon, Loader2, QrCode, RefreshCcw, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import Navbar from "./components/Navbar.jsx";
import Splash from "./components/Splash.jsx";
import ScannerOverlay from "./components/ScannerOverlay.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import Drawer from "./components/Drawer";
import LoginModal from "./components/LoginModal";
import OrdersList from "./components/OrdersList.jsx";
import PickupPool from "./components/PickupPool.jsx"; // ⬅️ NEW: driver screen

import { CONFIG, apiFetch, parseOrderNumberFromScan } from "./lib/api.js";
import {
  ensureCameraPermission,
  startWebQrScanner,
  openAppSettings,
  scanImageFile,
} from "./lib/scanner.js";

import { getAuth as loadAuth, setAuth as persistAuth, clearAuth as purgeAuth } from "./lib/auth.js";

export default function App() {
  const { t, i18n } = useTranslation();

  // UI prefs
  const [language, setLanguage] = useState("ar");
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Splash
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const tm = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(tm);
  }, []);

  // Navigation
  const [view, setView] = useState("home"); // "home" | "orders"

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [permDenied, setPermDenied] = useState(false);
  const [rawScan, setRawScan] = useState("");

  const scannerRef = useRef(null);
  const scannerDivId = "qr-scanner-region";
  const [scannerKey, setScannerKey] = useState(0);

  // Order/status state (home)
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [toast, setToast] = useState(null);

  // Authentication
  const [auth, setAuthState] = useState(null);
  const isAuthenticated = !!auth?.token;
  const role = auth?.role || auth?.userType || null;
  const isDriver = role && String(role).toLowerCase() === "driver";

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Restore auth on first load
  useEffect(() => {
    const saved = loadAuth();
    if (saved?.token) setAuthState(saved);
  }, []);

  const handleLogin = (authData) => {
    persistAuth(authData);
    setAuthState(authData);
    setIsDrawerOpen(false);
    setIsLoginModalOpen(false);
    // Driver lands on Orders (PickupPool with Pool/Mine tabs)
    setView("orders");
    setToast({ type: "success", msg: "Logged in ✓" });
    setTimeout(() => setToast(null), 1200);
  };

  const handleLogout = () => {
    purgeAuth();
    setAuthState(null);
    setIsDrawerOpen(false);
    setView("home");
    setToast({ type: "success", msg: "Logged out" });
    setTimeout(() => setToast(null), 1200);
  };

  // Stop any active scanner instance
  const stopScanner = useCallback(async () => {
    try {
      await scannerRef.current?.stop?.();
    } catch {}
    scannerRef.current = null;
  }, []);

  // Begin scanning (home)
  const beginScan = useCallback(async () => {
    setScanError("");
    setPermDenied(false);
    await stopScanner();

    const perm = await ensureCameraPermission();
    if (!perm.granted) {
      setPermDenied(true);
      setScanError(t("camera_permission_denied"));
      return;
    }

    setIsScanning(true);
    setTimeout(async () => {
      try {
        const s = await startWebQrScanner(
          scannerDivId,
          async (decoded) => {
            const ord = parseOrderNumberFromScan(decoded);
            if (ord) setOrderNumber(ord);
            setRawScan(decoded);
            await stopScanner();
            setIsScanning(false);
          },
          (err) => {
            setScanError(err || t("camera_init_failed"));
            setIsScanning(false);
          }
        );
        scannerRef.current = s;
      } catch {
        setScanError(t("camera_init_failed"));
        setIsScanning(false);
      }
    }, 120);
  }, [stopScanner, t]);

  // Cleanup on unmount
  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  // Fetch status (home)
  const getStatus = useCallback(async () => {
    if (!orderNumber) {
      setToast({ type: "error", msg: t("toast_need_order") });
      return;
    }
    setIsLoading(true);
    setToast(null);
    try {
      const data = await apiFetch(CONFIG.paths.getStatus(orderNumber));
      setCurrent(data);
    } catch (err) {
      setToast({ type: "error", msg: err.message || t("error_fetch_status") });
      setCurrent(null);
    } finally {
      setIsLoading(false);
    }
  }, [orderNumber, t]);

  // Reset home state
  const reset = useCallback(async () => {
    await stopScanner();
    setIsScanning(false);
    setScanError("");
    setPermDenied(false);
    setRawScan("");
    setCurrent(null);
    setOrderNumber("");
    setScannerKey((k) => k + 1);
  }, [stopScanner]);

  // Language change
  useEffect(() => {
    if (language !== i18n.language) i18n.changeLanguage(language);
  }, [language, i18n]);

  // Scan from image
  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await scanImageFile(
        file,
        (decoded) => {
          const ord = parseOrderNumberFromScan(decoded);
          if (ord) setOrderNumber(ord);
          setRawScan(decoded);
          setToast({ type: "success", msg: t("scanned_payload") + " ✓" });
        },
        (err) => setToast({ type: "error", msg: err || t("error_scan_image") })
      );
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="app-shell min-h-screen relative">
      {showSplash && <Splash />}

      <Navbar
        language={language}
        onChangeLanguage={setLanguage}
        isAuthenticated={isAuthenticated}
        onMenuClick={() => setIsDrawerOpen(true)}
        onOrdersClick={() => setView("orders")}
      />

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isAuthenticated={isAuthenticated}
        isDriver={isDriver}
        onLoginClick={() => {
          setIsDrawerOpen(false);
          setIsLoginModalOpen(true);
        }}
        onLogout={handleLogout}
        onOrdersClick={() => setView("orders")}
        language={language}
      />

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
        />
      )}

      <main className="content safe-b max-w-3xl mx-auto px-4 pb-6">
        {view === "home" && (
          <>
            {/* home screen unchanged — omitted for brevity */}
            {/* ... */}
          </>
        )}

        {view === "orders" && (
          isDriver ? <PickupPool /> : <OrdersList />
        )}

        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 rounded-xl px-5 py-3 shadow-lg flex items-center transition-all ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
            }`}
          >
            <div className="font-medium text-sm">{toast.msg}</div>
          </div>
        )}
      </main>

      <ScannerOverlay
        key={scannerKey}
        visible={isScanning}
        onClose={async () => {
          await stopScanner();
          setIsScanning(false);
        }}
        scannerDivId={scannerDivId}
        title={t("scan")}
      />
    </div>
  );
}
