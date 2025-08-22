// src/lib/api.js
import { getAuth } from "./auth.js";

const CONFIG = {
  API_BASE_URL: "https://apidelivery.devmedialm.com",
  paths: {
    getStatus: (orderNumber) =>
      `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

// ----- NEW: auth base + login request -----
const AUTH_BASE_URL = "https://apidelivery.devmedialm.com";

/**
 * POST /auth/login
 * Body: { email, password }
 * Success payload (example):
 * {
 *   "status":200,
 *   "token":"<jwt>",
 *   "role":"user",
 *   "warehouseId":"68a3137ccd71d32a1dbc8433"
 * }
 */
async function loginRequest(email, password) {
  const url = `${AUTH_BASE_URL}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  // Try to parse JSON either way
  let data = {};
  try {
    data = await res.json();
  } catch {
    // ignore parsing error; we'll error below
  }

  const okByBody = typeof data?.status === "number" ? data.status === 200 : true;

  if (!res.ok || !okByBody || !data?.token) {
    const msg =
      data?.message ||
      data?.error ||
      `Login failed (${res.status}${res.statusText ? `: ${res.statusText}` : ""})`;
    throw new Error(msg);
  }
  return data; // { status, token, role, warehouseId }
}

// ----- existing fetch with auth header injection -----
async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  // Attach Bearer token if present
  const auth = getAuth();
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${text ? `: ${text}` : `: ${res.statusText}`}`);
    }
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    throw new Error(err?.message || "Network error. Please try again.");
  }
}

function parseOrderNumberFromScan(payload) {
  if (!payload) return "";
  try {
    const url = new URL(payload);
    const candidates = ["order", "orderId", "order_id", "ordernumber", "orderNumber", "o"];
    for (const key of candidates) {
      const v = url.searchParams.get(key);
      if (v) return v.trim();
    }
    const pathParts = url.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && /[A-Za-z0-9_-]{4,}/.test(last)) return last;
  } catch (_) {}
  const tokens = String(payload)
    .split(/[^A-Za-z0-9_-]+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return tokens[0] || "";
}

export { CONFIG, apiFetch, parseOrderNumberFromScan, loginRequest };
