import { getAuth } from "./auth.js";

// Use your main API for ALL endpoints
const API_BASE = "https://apidelivery.devmedialm.com";
export const AUTH_BASE_URL = API_BASE;

const CONFIG = {
  API_BASE_URL: API_BASE,
  paths: {
    getStatus: (orderNumber) => `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

// ---------- AUTH ----------
async function loginRequest(email, password) {
  const url = `${AUTH_BASE_URL}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const rawTextPromise = res.clone().text().catch(() => "");
  let data = null;
  try { data = await res.json(); } catch {}
  const rawText = await rawTextPromise;

  const okByBody = typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody || !data?.token) {
    const serverMsg = (data && (data.message || data.error)) || (rawText && rawText.slice(0, 300)) || "";
    throw new Error(`Login failed (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}) ${serverMsg ? `- ${serverMsg}` : ""} [AUTH_BASE=${AUTH_BASE_URL}]`);
  }
  return data; // { status, token, role, warehouseId }
}

// ---------- ORDERS: Assigned to me ----------
async function fetchAssignedOrders({ page = 1, limit = 15, sortBy = "orderDate", sortDir = "desc" } = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token found. Please log in again.");

  const url = `${AUTH_BASE_URL}/orders/my-assigned?page=${page}&limit=${limit}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${auth.token}` } });

  let data = null, rawText = "";
  try { data = await res.clone().json(); } catch {}
  try { rawText = await res.text(); } catch {}

  const okByBody = typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody) {
    const serverMsg = (data && (data.message || data.error)) || (rawText && rawText.slice(0, 300)) || "";
    throw new Error(`Orders fetch failed (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""})${serverMsg ? ` - ${serverMsg}` : ""}`);
  }

  return {
    status: 200,
    role: data?.role,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count: data?.count ?? (Array.isArray(data?.orders) ? data.orders.length : 0),
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

// ---------- DRIVER: Awaiting Pickup (pool + mine) ----------
async function fetchAwaitingPickupOrders({ page = 1, limit = 15, unassigned, mine, q, city } = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (unassigned === true) params.set("unassigned", "true");
  if (mine === true) params.set("mine", "true");
  if (q) params.set("q", q);
  if (city) params.set("city", city);

  const url = `${AUTH_BASE_URL}/orders/awaiting-pickup?${params.toString()}`;
  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${auth.token}` } });

  let data = null, raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okBody = typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okBody) {
    const serverMsg = (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(`Pickup fetch failed (HTTP ${res.status}${res.statusText ? " " + res.statusText : ""})${serverMsg ? " - " + serverMsg : ""}`);
  }

  return {
    status: 200,
    role: data?.role,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count: data?.count ?? (Array.isArray(data?.orders) ? data.orders.length : 0),
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

const fetchAwaitingPickupMine = (opts = {}) => fetchAwaitingPickupOrders({ ...opts, mine: true, unassigned: false });

// ---------- DRIVER: Claim by scanned orderNo ----------
/**
 * POST /orders/:orderNo/claim-pickup
 * Body: { verifyLabel: false, advance: true }
 */
async function claimPickupByOrderNo(orderNo) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number from QR.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/claim-pickup`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${auth.token}` },
    body: JSON.stringify({ verifyLabel: false, advance: true }),
  });

  let data = null, raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody = typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody) {
    const serverMsg = (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(`Claim failed (HTTP ${res.status}${res.statusText ? " " + res.statusText : ""})${serverMsg ? " - " + serverMsg : ""}`);
  }
  return data || { status: 200 };
}

// ---------- PUBLIC (auto-bearer) ----------
async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;
  const headers = { ...(options.body ? { "Content-Type": "application/json" } : {}), Accept: "application/json", ...options.headers };
  const auth = getAuth();
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      throw new Error(`API ${res.status}${res.statusText ? ` ${res.statusText}` : ""}${raw ? ` - ${raw.slice(0, 300)}` : ""} [BASE=${CONFIG.API_BASE_URL}]`);
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
  const tokens = String(payload).split(/[^A-Za-z0-9_-]+/).filter(Boolean).sort((a, b) => b.length - a.length);
  return tokens[0] || "";
}

export {
  CONFIG,
  apiFetch,
  parseOrderNumberFromScan,
  loginRequest,
  fetchAssignedOrders,
  fetchAwaitingPickupOrders,
  fetchAwaitingPickupMine,
  claimPickupByOrderNo,
};
