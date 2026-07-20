import axios from "axios";

// The backend URL is baked in at build time via Vite env vars. Keeping this
// as the one place that reads import.meta.env means every other file just
// imports `api` and doesn't care where it's deployed.
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE_URL });

const TOKEN_KEY = "reconciliation_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize every failure into a plain string message so components never
// need to know whether it was a network error, a validation 422, or an
// unexpected 500 — they just render `error`.
export function extractErrorMessage(err) {
  if (err?.response?.data?.detail) return err.response.data.detail;
  if (err?.message === "Network Error") {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (err?.code === "ECONNABORTED") return "That request timed out. Try again.";
  return err?.message || "Something went wrong.";
}

// A single 401 anywhere means the token is dead (expired / invalid) — log
// the whole app out rather than letting every screen fail independently.
let onUnauthorized = null;
export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(err);
  }
);
