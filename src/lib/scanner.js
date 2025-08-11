import { Camera } from "@capacitor/camera";
import { App } from "@capacitor/app";

export async function ensureCameraPermission() {
  try {
    const status = await Camera.checkPermissions();
    if (status.camera === "granted") return { granted: true, canOpenSettings: false };
    const req = await Camera.requestPermissions({ permissions: ["camera"] });
    if (req.camera === "granted") return { granted: true, canOpenSettings: false };
    return { granted: false, canOpenSettings: true };
  } catch {
    return { granted: false, canOpenSettings: true };
  }
}

export async function openAppSettings() {
  try { await App.openSettings(); } catch {}
}

export async function startWebQrScanner(mountDivId, onDecoded, onError) {
  try {
    const isLocalhost = (window.location.hostname || "").includes("localhost");
    if (window.location.protocol !== "https:" && !isLocalhost) {
      throw new Error("Camera requires a secure origin (HTTPS).");
    }

    const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
    const el = document.getElementById(mountDivId);
    if (!el) throw new Error("Scanner mount element not found");

    // Prefer the back camera if possible
    let cameraConfig = { facingMode: "environment" };
    try {
      const cams = await Html5Qrcode.getCameras();
      const back = cams?.find(d => /back|rear|environment/i.test(d.label)) || cams?.[0];
      if (back?.id) cameraConfig = { deviceId: { exact: back.id } };
    } catch { /* ignore */ }

    // Square qrbox based on the mount element size
    const rect = el.getBoundingClientRect();
    const base = Math.max(220, Math.min(480, Math.floor(Math.min(rect.width, rect.height) * 0.9)));

    const scanner = new Html5Qrcode(mountDivId, {
      verbose: false,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });

    await scanner.start(
      cameraConfig,
      { fps: 12, qrbox: { width: base, height: base } },
      (decoded) => onDecoded?.(decoded),
      () => {}
    );

    return {
      stop: async () => {
        try { await scanner.stop(); await scanner.clear(); } catch {}
      }
    };
  } catch (e) {
    const msg = (e && e.message) || String(e);
    if (/NotAllowedError/i.test(msg)) {
      onError?.("Camera permission denied by the system. Grant Camera in Settings and try again.");
    } else {
      onError?.(msg);
    }
    return { stop: async () => {} };
  }
}

export async function scanImageFile(file, onDecoded, onError) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const result = await Html5Qrcode.scanFile(file, true);
    onDecoded?.(result);
  } catch (e) {
    onError?.(e?.message || "Failed to scan image");
  }
}
