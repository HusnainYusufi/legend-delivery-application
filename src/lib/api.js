const CONFIG = {
  API_BASE_URL: "https://apidelivery.devmedialm.com",
  paths: {
    getStatus: (orderNumber) => `/orders/${encodeURIComponent(orderNumber)}/status-overview`,
  },
};

async function apiFetch(path, options = {}) {
  const url = `${CONFIG.API_BASE_URL}${path}`;
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    return res.json();
  } catch (err) {
    console.error("API error:", err);
    throw new Error("Failed to fetch data. Please try again.");
  }
}

function parseOrderNumberFromScan(payload) {
  if (!payload) return "";
  try {
    const url = new URL(payload);
    const candidates = ["order","orderId","order_id","ordernumber","orderNumber","o"];
    for (const key of candidates) {
      const v = url.searchParams.get(key);
      if (v) return v.trim();
    }
    const pathParts = url.pathname.split("/").filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && /[A-Za-z0-9_-]{4,}/.test(last)) return last;
  } catch(_) {}
  const tokens = String(payload).split(/[^A-Za-z0-9_-]+/).filter(Boolean).sort((a,b)=>b.length-a.length);
  return tokens[0] || "";
}

export { CONFIG, apiFetch, parseOrderNumberFromScan };