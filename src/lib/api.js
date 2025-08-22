// src/lib/api.js
import { getAuth } from "./auth.js";

// Use your main API for all endpoints
const API_BASE = "https://apidelivery.devmedialm.com";

// Exported for debugging/messages elsewhere
export const AUTH_BASE_URL = API_BASE;

const CONFIG = {
  API_BASE_URL: API_BASE,
  paths: {
    getStatus: (orderNumber) =>
      `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

// ---------- AUTH ----------
/**
 * POST /auth/login
 * Body: { email, password }
 * Response: { status: 200, token, role, warehouseId }
 */
async function loginRequest(email, password) {
  const url = `${AUTH_BASE_URL}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  const okByBody = typeof data?.status === "number" ? data.status === 200 : true;

  if (!res.ok || !okByBody || !data?.token) {
    const msg =
      data?.message ||
      data?.error ||
      `Login failed (${res.status}${res.statusText ? `: ${res.statusText}` : ""}) [AUTH_BASE=${AUTH_BASE_URL}]`;
    throw new Error(msg);
  }
  return data; // { status, token, role, warehouseId }
}

// ---------- ORDERS (POST with JWT) ----------
/**
 * POST /orders/my-assigned?page=&limit=&sortBy=&sortDir=
 * Headers: Authorization: Bearer <token>
 * Body: {}  (empty payload is OK)
 */
async function fetchAssignedOrders({
  page = 1,
  limit = 15,
  sortBy = "orderDate",
  sortDir = "desc",
} = {}) {
  const auth = getAuth();
  const url = `${AUTH_BASE_URL}/orders/my-assigned?page=${page}&limit=${limit}&sortBy=${encodeURIComponent(
    sortBy
  )}&sortDir=${encodeURIComponent(sortDir)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: JSON.stringify({}),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok || data?.status !== 200) {
    const msg =
      data?.message ||
      data?.error ||
      `Orders fetch failed (${res.status}${res.statusText ? `: ${res.statusText}` : ""}) [AUTH_BASE=${AUTH_BASE_URL}]`;
    throw new Error(msg);
  }
  return data; // { status, role, page, limit, count, orders: [...] }
}

// ---------- PUBLIC API (Bearer auto-attached) ----------
async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const auth = getAuth();
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

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

// ---------- QR helper ----------
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

export {
  CONFIG,
  apiFetch,
  parseOrderNumberFromScan,
  loginRequest,
  fetchAssignedOrders,
};
