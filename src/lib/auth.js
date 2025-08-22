// src/lib/auth.js
const STORAGE_KEY = "ld_auth_v1";

export function getAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.token) return null;
    return obj;
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth || {}));
  } catch {}
}

export function clearAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// lightweight JWT payload decode (no verification)
export function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}
