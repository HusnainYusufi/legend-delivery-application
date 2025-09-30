// src/lib/api.js
import { getAuth } from "./auth.js";

// Use your main API for ALL standard endpoints
const API_BASE = "https://api.shaheene.com";
// OTP service base (same host currently)
const OTP_BASE = "https://api.shaheene.com";

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
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const rawTextPromise = res.clone().text().catch(() => "");
  let data = null;
  try { data = await res.json(); } catch {}

  const rawText = await rawTextPromise;
  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;

  if (!res.ok || !okByBody || !data?.token) {
    const serverMsg =
      (data && (data.message || data.error)) ||
      (rawText && rawText.slice(0, 300)) ||
      "";
    const msg = `Login failed (HTTP ${res.status}${
      res.statusText ? ` ${res.statusText}` : ""
    }) ${serverMsg ? `- ${serverMsg}` : ""} [AUTH_BASE=${AUTH_BASE_URL}]`;
    throw new Error(msg);
  }
  return data; // { status, token, role, warehouseId }
}

// ---------- ORDERS: Assigned to me (staff) ----------
async function fetchAssignedOrders({
  page = 1,
  limit = 15,
  sortBy = "orderDate",
  sortDir = "desc",
} = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token found. Please log in again.");

  const url = `${AUTH_BASE_URL}/orders/my-assigned?page=${page}&limit=${limit}&sortBy=${encodeURIComponent(
    sortBy
  )}&sortDir=${encodeURIComponent(sortDir)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  });

  let data = null;
  let rawText = "";
  try { data = await res.clone().json(); } catch {}
  try { rawText = await res.text(); } catch {}

  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) ||
      (rawText && rawText.slice(0, 300)) ||
      "";
    throw new Error(
      `Orders fetch failed (HTTP ${res.status}${
        res.statusText ? ` ${res.statusText}` : ""
      })${serverMsg ? ` - ${serverMsg}` : ""}`
    );
  }

  return {
    status: 200,
    role: data?.role,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count:
      data?.count ?? (Array.isArray(data?.orders) ? data.orders.length : 0),
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

// ---------- DRIVER: Awaiting Pickup (unassigned pool or mine) ----------
async function fetchAwaitingPickupOrders({
  page = 1,
  limit = 15,
  unassigned,
  mine,
  q,
  city,
} = {}) {
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

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `Pickup fetch failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }

  return {
    status: 200,
    role: data?.role,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count:
      data?.count ?? (Array.isArray(data?.orders) ? data.orders.length : 0),
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

// convenience (legacy "mine" awaiting pickup if server supports it)
const fetchAwaitingPickupMine = (opts = {}) =>
  fetchAwaitingPickupOrders({ ...opts, mine: true, unassigned: false });

// ---------- DRIVER: My In-Transit (claimed by this driver) ----------
async function fetchMyInTransitOrders({ page = 1, limit = 20 } = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");

  const url = `${AUTH_BASE_URL}/orders/my-in-transit?page=${page}&limit=${limit}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `My In-Transit fetch failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }

  return {
    status: 200,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    count:
      data?.count ?? (Array.isArray(data?.orders) ? data.orders.length : 0),
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

// ---------- DRIVER: Claim by scanned orderNo ----------
async function claimPickupByOrderNo(orderNo) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number from QR.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/claim-pickup`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ verifyLabel: false, advance: true }), // claim body
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody = typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `Claim failed (HTTP ${res.status}${res.statusText ? " " + res.statusText : ""})${serverMsg ? " - " + serverMsg : ""}`
    );
  }
  return data || { status: 200 };
}

// ---------- DRIVER: Send OTP (to customer) ----------
/**
 * POST /orders/:orderNo/otp/send
 */
async function sendOrderOtp(orderNo) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number.");

  const url = `${OTP_BASE}/orders/${encodeURIComponent(orderNo)}/otp/send`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({}),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `OTP send failed (HTTP ${res.status}${
        res.statusText ? ` ${res.statusText}` : ""
      })${serverMsg ? ` - ${serverMsg}` : ""}`
    );
  }
  return data || { status: 200 };
}

// ---------- DRIVER: Verify OTP (deliver) ----------
/**
 * POST /orders/:orderNo/otp/verify
 * Body: { code: "123456" }
 * Role: driver/admin/csr_user (JWT)
 * On success -> { status:200, message:"OTP verified. Order delivered." }
 * Common errors:
 * 404 No active OTP, 410 expired, 401 incorrect (attempts left), 429 too many attempts
 */
async function verifyOrderOtp(orderNo, code) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number.");
  if (!code || String(code).trim().length < 4) throw new Error("Enter the OTP code.");

  const url = `${OTP_BASE}/orders/${encodeURIComponent(orderNo)}/otp/verify`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ code: String(code).trim() }),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  if (!res.ok || (typeof data?.status === "number" && data.status !== 200)) {
    // Friendly error mapping
    if (res.status === 404) throw new Error("No active OTP for this order (send one first).");
    if (res.status === 410) throw new Error("OTP expired.");
    if (res.status === 401) throw new Error(data?.message || "Incorrect code.");
    if (res.status === 429) throw new Error("Too many attempts. Try again later.");
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `OTP verify failed (HTTP ${res.status}${
        res.statusText ? ` ${res.statusText}` : ""
      })${serverMsg ? ` - ${serverMsg}` : ""}`
    );
  }

  return data || { status: 200, message: "OTP verified. Order delivered." };
}

// ---------- PUBLIC API (Bearer auto-attached) ----------
async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;

  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    Accept: "application/json",
    ...options.headers,
  };

  const auth = getAuth();
  if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      throw new Error(
        `API ${res.status}${res.statusText ? ` ${res.statusText}` : ""}${
          raw ? ` - ${raw.slice(0, 300)}` : ""
        } [BASE=${CONFIG.API_BASE_URL}]`
      );
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
    const candidates = [
      "order",
      "orderId",
      "order_id",
      "ordernumber",
      "orderNumber",
      "o",
    ];
    for (const key of candidates) {
      const v = url.searchParams.get(key);
      if (v) return v.trim();
    }
    const pathParts = url.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && /[A-Za-z0-9_-]{4,}/.test(last)) return last;
  } catch (_) {}
  const tokens = String(payload)
    .split(/[^A-Za-z0-9_-]+/).filter(Boolean)
    .sort((a, b) => b.length - a.length);
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
  fetchMyInTransitOrders,
  claimPickupByOrderNo,
  sendOrderOtp,
  verifyOrderOtp,
};
