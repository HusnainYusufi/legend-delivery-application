// We request CAMERA permission via the Capacitor Camera plugin so WebView getUserMedia works.
// Scanner itself uses html5-qrcode (web) with a polished full-screen overlay.
import { Camera } from "@capacitor/camera";

export async function ensureCameraPermission() {
  try {
    // Ask at runtime (Android 12+ needs explicit grant)
    await Camera.requestPermissions({ permissions: ["camera"] });
    return true;
  } catch {
    return false;
  }
}

export async function startWebQrScanner(mountDivId, onDecoded, onError) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5Qr = new Html5Qrcode(mountDivId, { verbose: false });
    const config = { fps: 12, qrbox: { width: 280, height: 280 } };
    await html5Qr.start(
      { facingMode: "environment" },
      config,
      (decoded) => { onDecoded?.(decoded); },
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
