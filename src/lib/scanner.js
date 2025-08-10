import { Camera } from "@capacitor/camera";
import { App } from "@capacitor/app";

// Ask Android for CAMERA permission via native plugin.
// If denied permanently, return { granted:false, canOpenSettings:true }
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
  try { await App.openSettings(); } catch (_) {}
}

// Web QR scanner using html5-qrcode
export async function startWebQrScanner(mountDivId, onDecoded, onError) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5Qr = new Html5Qrcode(mountDivId, { verbose: false });
    const config = { fps: 12, qrbox: { width: 280, height: 280 } };
    await html5Qr.start(
      { facingMode: "environment" },
      config,
      (decoded) => onDecoded?.(decoded),
      () => {}
    );
    return {
      stop: async () => { try { await html5Qr.stop(); await html5Qr.clear(); } catch {} },
    };
  } catch (e) {
    onError?.(e?.message || String(e));
    return { stop: async () => {} };
  }
}

// Optional: scan from image if live camera fails
export async function scanImageFile(file, onDecoded, onError) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const tempId = "one-shot-scanner";
    const el = document.createElement("div");
    el.id = tempId;
    el.style.display = "none";
    document.body.appendChild(el);
    const html5Qr = new Html5Qrcode(tempId);
    const result = await html5Qr.scanFile(file, true);
    await html5Qr.clear();
    el.remove();
    onDecoded?.(result);
  } catch (e) {
    onError?.(e?.message || String(e));
  }
}
