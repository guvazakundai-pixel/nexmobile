// ═══════════════════════════════════════════════════════════════════════════════
// NEXMOBILE — API Client
// Handles all communication with the backend server
// Falls back to defaults if the API is unreachable
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3456";

// ─── Token Management ─────────────────────────────────────────────────────────
let token = localStorage.getItem("nex_token") || null;

export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("nex_token", t);
  else localStorage.removeItem("nex_token");
}

export function getToken() {
  return token;
}

export function isLoggedIn() {
  return !!token;
}

// ─── Fetch Wrapper ────────────────────────────────────────────────────────────
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API error ${res.status}`);
  }

  return res.json();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export async function login(password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setToken(data.token);
  return data;
}

export async function verifyToken() {
  try {
    await api("/api/auth/verify");
    return true;
  } catch {
    setToken(null);
    return false;
  }
}

export async function changePassword(currentPassword, newPassword) {
  return api("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function logout() {
  setToken(null);
}

// ─── PHONES ───────────────────────────────────────────────────────────────────
export async function getPhones() {
  return api("/api/phones");
}

export async function getPhonesFull() {
  return api("/api/phones/full");
}

export async function addPhone(phone) {
  return api("/api/phones", {
    method: "POST",
    body: JSON.stringify(phone),
  });
}

export async function updatePhone(id, data) {
  return api(`/api/phones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePhone(id) {
  return api(`/api/phones/${id}`, { method: "DELETE" });
}

export async function bulkPrice(params) {
  return api("/api/phones/bulk-price", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function bulkDiscount(params) {
  return api("/api/phones/bulk-discount", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function resetPhones() {
  return api("/api/phones/reset", { method: "POST" });
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export async function getOrders() {
  return api("/api/orders");
}

export async function createOrder(order) {
  return api("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function updateOrderStatus(id, status) {
  return api(`/api/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function clearOrders() {
  return api("/api/orders", { method: "DELETE" });
}

// ─── BANNERS ──────────────────────────────────────────────────────────────────
export async function getBanners() {
  return api("/api/banners");
}

export async function getAllBanners() {
  return api("/api/banners/all");
}

export async function addBanner(text) {
  return api("/api/banners", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export async function updateBanner(id, data) {
  return api(`/api/banners/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id) {
  return api(`/api/banners/${id}`, { method: "DELETE" });
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export async function getSettings() {
  return api("/api/settings");
}

export async function updateSettings(data) {
  return api("/api/settings", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ─── BACKUP ───────────────────────────────────────────────────────────────────
export async function downloadBackup() {
  return api("/api/backup");
}

export async function restoreBackup(data) {
  return api("/api/restore", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
