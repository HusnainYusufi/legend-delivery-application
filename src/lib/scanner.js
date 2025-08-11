import { Camera } from "@capacitor/camera";
import { App } from "@capacitor/app";

export async function ensureCameraPermission() {
  try {
    const status = await Camera.checkPermissions();
    if (status.camera === "granted") return { granted: true };
    
    const request = await Camera.requestPermissions({ permissions: ["camera"] });
    return { granted: request.camera === "granted" };
  } catch (error) {
    console.error("Permission error:", error);
    return { granted: false };
  }
}

export async function openAppSettings() {
  try { 
    await App.openSettings(); 
  } catch (error) {
    console.error("Failed to open settings:", error);
  }
}

export async function startWebQrScanner(mountDivId, onDecoded, onError) {
  try {
    // Check if we're on HTTPS
    if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost")) {
      throw new Error("Camera requires HTTPS connection");
    }
    
    const { Html5Qrcode } = await import("html5-qrcode");
    const html5Qr = new Html5Qrcode(mountDivId, { verbose: false });
    
    // Ensure the scanner element exists
    const scannerElement = document.getElementById(mountDivId);
    if (!scannerElement) {
      throw new Error("Scanner element not found");
    }
    
    await html5Qr.start(
      { facingMode: "environment" },
      { 
        fps: 10, 
        qrbox: { 
          width: Math.min(250, scannerElement.clientWidth - 40), 
          height: Math.min(250, scannerElement.clientHeight - 40) 
        } 
      },
      (decoded) => onDecoded?.(decoded),
      () => {}
    );
    
    return {
      stop: async () => {
        try {
          await html5Qr.stop();
          await html5Qr.clear();
        } catch (stopError) {
          console.error("Error stopping scanner:", stopError);
        }
      }
    };
  } catch (error) {
    console.error("Scanner initialization failed:", error);
    onError?.(error.message || "Failed to initialize scanner");
    return { stop: () => {} };
  }
}

export async function scanImageFile(file, onDecoded, onError) {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    const result = await Html5Qrcode.scanFile(file, true);
    onDecoded?.(result);
  } catch (error) {
    console.error("Image scan error:", error);
    onError?.(error.message || "Failed to scan image");
  }
}