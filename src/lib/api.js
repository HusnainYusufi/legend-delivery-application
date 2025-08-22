// src/lib/api.js
import { getAuth } from "./auth.js";

const CONFIG = {
  API_BASE_URL: "https://apidelivery.devmedialm.com",
  paths: {
    getStatus: (orderNumber) =>
      `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

// Use env for dev/prod switching. Example .env:
// VITE_AUTH_BASE_URL=http://192.168.X.Y:3265
const LOCAL_API_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL?.trim() || "https://apidelivery.devmedialm.com";

// ----- AUTH -----
async function loginRequest(email, password) {
  const url = `${LOCAL_API_BASE_URL}/auth/login`;
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
      `Login failed (${res.status}${res.statusText ? `: ${res.statusText}` : ""})`;
    throw new Error(msg);
  }
  return data; // { status, token, role, warehouseId }
}

// ----- ORDERS (POST with JWT) -----
async function fetchAssignedOrders({
  page = 1,
  limit = 15,
  sortBy = "orderDate",
  sortDir = "desc",
} = {}) {
  const auth = getAuth();
  const url = `${LOCAL_API_BASE_URL}/orders/my-assigned?page=${page}&limit=${limit}&sortBy=${encodeURIComponent(
    sortBy
  )}&sortDir=${encodeURIComponent(sortDir)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
    },
    body: JSON.stringify({}), // body not specified by API; sending empty object
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (!res.ok || data?.status !== 200) {
    const msg =
      data?.message ||
      data?.error ||
      `Orders fetch failed (${res.status}${res.statusText ? `: ${res.statusText}` : ""})`;
    throw new Error(msg);
  }
  return data; // { status, role, page, limit, count, orders: [...] }
}

// ----- existing fetch with auth header injection for main API -----
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

export {
  CONFIG,
  apiFetch,
  parseOrderNumberFromScan,
  loginRequest,
  fetchAssignedOrders,
};
