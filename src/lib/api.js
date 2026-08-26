// src/lib/api.js
import { getAuth } from "./auth.js";

// Use your main API for ALL standard endpoints
const API_BASE = "https://api.shaheene.com";

// Exported for debugging/messages elsewhere
export const AUTH_BASE_URL = API_BASE;

const CONFIG = {
  API_BASE_URL: API_BASE,
  paths: {
    getStatus: (orderNumber) =>
      `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

/** Default request timeout in ms */
const DEFAULT_TIMEOUT = 15000;

/**
 * Wraps fetch with an AbortController timeout.
 * Automatically aborts the request if it takes longer than `ms`.
 */
function fetchWithTimeout(url, options = {}, ms = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === "AbortError") {
        throw new Error(`Request timed out after ${ms / 1000}s — server not responding.`);
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
}

/* ---------------- AUTH ---------------- */
/**
 * POST /auth/login
 * Body: { email, password }
 * Response: { status: 200, token, role, warehouseId }
 */
async function loginRequest(email, password) {
  const url = `${AUTH_BASE_URL}/auth/login`;
  const res = await fetchWithTimeout(url, {
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
    const msg = `Login failed${res.status ? ` (${res.status})` : ""}${serverMsg ? ` — ${serverMsg}` : ""}`;
    throw new Error(msg);
  }
  return data; // { status, token, role, warehouseId }
}

/* --------------- STAFF: Assigned to me --------------- */
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

  const res = await fetchWithTimeout(url, {
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

/* --------------- DRIVER: Awaiting pickup (pool + mine) --------------- */
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

  const res = await fetchWithTimeout(url, {
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

const fetchAwaitingPickupMine = (opts = {}) =>
  fetchAwaitingPickupOrders({ ...opts, mine: true, unassigned: false });

/* --------------- DRIVER: My in-transit (server paginated) --------------- */
async function fetchMyInTransit({ page = 1, limit = 20 } = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");

  const url = `${AUTH_BASE_URL}/orders/my-in-transit?page=${page}&limit=${limit}`;

  const res = await fetchWithTimeout(url, {
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
      `My in-transit fetch failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }

  return {
    status: 200,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

/* --------------- DRIVER: My delivered (server paginated) --------------- */
async function fetchMyDelivered({ page = 1, limit = 20 } = {}) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");

  const url = `${AUTH_BASE_URL}/orders/my-delivered?page=${page}&limit=${limit}`;

  const res = await fetchWithTimeout(url, {
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
      `My delivered fetch failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }

  return {
    status: 200,
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? 0,
    hasMore: data?.hasMore ?? false,
    orders: Array.isArray(data?.orders) ? data.orders : [],
  };
}

/* --------------- DRIVER: (Re)send OTP to customer --------------- */
/**
 * POST /orders/:orderNo/otp/send
 * Triggers an OTP SMS to the customer for the given order.
 * Optional body: { packageId }
 */
async function sendOrderOtp(orderNo, packageId = null) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/otp/send`;
  const body = {};
  if (packageId) body.packageId = packageId;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(body),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;
  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `Send OTP failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }
  return data || { status: 200 };
}

/* --------------- DRIVER: Claim by scanned orderNo --------------- */
async function claimPickupByOrderNo(orderNo) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number from QR.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/claim-pickup`;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ verifyLabel: false, advance: true }),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;

  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `Claim failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }

  return data || { status: 200 };
}

/* --------------- DRIVER: Verify OTP (no "send OTP") --------------- */
/**
 * POST /orders/:orderNo/otp/verify
 * Body: { code: "1234", pkgKey: "PK-AB12C" }
 * On success: { status: 200, message: "OTP verified. Order delivered." }
 */
async function verifyOrderOtp(orderNo, code, pkgKey) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number.");
  if (!code) throw new Error("Missing OTP code.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/otp/verify`;

  const payload = { code };
  if (pkgKey) payload.pkgKey = pkgKey;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;

  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `OTP verify failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }
  return data || { status: 200 };
}

/* ---------------- PUBLIC (adds bearer if present) ---------------- */
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
    const res = await fetchWithTimeout(url, { ...options, headers });
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

/* --------------- DRIVER: Set delivery note (failed delivery) --------------- */
/**
 * POST /orders/:orderNo/delivery-note
 * Body: { note: "POSTPONED" | "NEEDS_ACTION" | "NOT_AVAILABLE" }
 * Called when driver marks delivery as failed and adds a note
 */
async function setDeliveryNote(orderNo, note) {
  const auth = getAuth();
  if (!auth?.token) throw new Error("No auth token. Please log in.");
  if (!orderNo) throw new Error("Missing order number.");
  if (!note) throw new Error("Missing delivery note.");

  const url = `${AUTH_BASE_URL}/orders/${encodeURIComponent(orderNo)}/delivery-note`;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ note }),
  });

  let data = null;
  let raw = "";
  try { data = await res.clone().json(); } catch {}
  try { raw = await res.text(); } catch {}

  const okByBody =
    typeof data?.status === "number" ? data.status === 200 : res.ok;

  if (!res.ok || !okByBody) {
    const serverMsg =
      (data && (data.message || data.error)) || (raw && raw.slice(0, 300)) || "";
    throw new Error(
      `Set delivery note failed (HTTP ${res.status}${
        res.statusText ? " " + res.statusText : ""
      })${serverMsg ? " - " + serverMsg : ""}`
    );
  }
  return data || { status: 200 };
}

/* ---------------- QR helper ---------------- */

// Query-string keys that can carry the order number, matched case-insensitively.
// "orderno" is first because it is what this system's own labels emit:
// LabelService.makeScanUrl builds "/scan?orderNo=<no>&code=<uuid>".
const ORDER_PARAM_KEYS = ["orderno", "ordernumber", "orderid", "order_id", "order", "o"];

// Path segments that are route names, never order numbers. Without this guard
// the last-segment fallback returns "scan" from our own label URLs.
const NON_ORDER_SEGMENTS = new Set([
  "scan", "track", "tracking", "order", "orders", "o", "status", "label", "labels",
]);

/**
 * Extract an order number from a scanned QR payload.
 *
 * Handles every shape the backend can produce (LABEL_QR_MODE):
 *   URL       -> https://app.../scan?orderNo=278198919&code=<uuid>   (default)
 *   ORDER_NO  -> 278198919
 *   JSON      -> {"orderNo":"278198919","code":"<uuid>"}
 */
function parseOrderNumberFromScan(payload) {
  if (!payload) return "";

  // 1) URL form — query params first, matched case-insensitively.
  try {
    const url = new URL(payload);

    const params = new Map();
    url.searchParams.forEach((value, key) => {
      const k = key.toLowerCase();
      if (!params.has(k)) params.set(k, value);
    });
    for (const key of ORDER_PARAM_KEYS) {
      const v = (params.get(key) || "").trim();
      if (v) return v;
    }

    // Then the last meaningful path segment, skipping route names.
    const parts = url.pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      let seg = parts[i];
      try { seg = decodeURIComponent(seg); } catch { /* keep raw */ }
      seg = seg.trim();
      if (!seg || NON_ORDER_SEGMENTS.has(seg.toLowerCase())) continue;
      if (/^[A-Za-z0-9_-]{4,}$/.test(seg)) return seg;
    }
  } catch {
    // not a URL — fall through
  }

  // 2) JSON form.
  try {
    const obj = JSON.parse(payload);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      for (const key of Object.keys(obj)) {
        if (ORDER_PARAM_KEYS.includes(key.toLowerCase())) {
          const v = String(obj[key] ?? "").trim();
          if (v) return v;
        }
      }
    }
  } catch {
    // not JSON — fall through
  }

  // 3) Bare value, or last-resort scrape. Order numbers in this system are
  // numeric, so prefer a numeric token over merely the longest one.
  const tokens = String(payload).split(/[^A-Za-z0-9_-]+/).filter(Boolean);
  const numeric = tokens.find((t) => /^\d{4,}$/.test(t));
  if (numeric) return numeric;
  return tokens.slice().sort((a, b) => b.length - a.length)[0] || "";
}

export {
  CONFIG,
  apiFetch,
  parseOrderNumberFromScan,
  loginRequest,
  fetchAssignedOrders,
  fetchAwaitingPickupOrders,
  fetchAwaitingPickupMine,
  fetchMyInTransit,
  fetchMyDelivered,
  claimPickupByOrderNo,
  sendOrderOtp,
  verifyOrderOtp,
  setDeliveryNote,
};
