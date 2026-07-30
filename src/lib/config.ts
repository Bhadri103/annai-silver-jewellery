const configuredApiUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();

export const API_BASE_URL = (
  configuredApiUrl
  || (import.meta.env.DEV ? "http://localhost:3000/api" : `${window.location.origin}/api`)
).replace(/\/+$/, "");

