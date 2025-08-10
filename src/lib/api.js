const CONFIG = {
  API_BASE_URL: import.meta?.env?.VITE_API_BASE_URL || "https://api.example.com",
  API_TOKEN: import.meta?.env?.VITE_API_TOKEN || "",
  paths: {
    getStatus: (orderNumber) => `/orders/${encodeURIComponent(orderNumber)}`,
    applyStatus: (orderNumber) => `/orders/${encodeURIComponent(orderNumber)}/status`,
  },
  statuses: [
    "pending",
    "processing",
    "packed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ],
};

const DEFAULT_MOCK_MODE = CONFIG.API_BASE_URL.includes("example.com");

async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;
  const headers = {
    ...(CONFIG.API_TOKEN ? { Authorization: `Bearer ${CONFIG.API_TOKEN}` } : {}),
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
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

export { CONFIG, DEFAULT_MOCK_MODE, apiFetch, parseOrderNumberFromScan };
