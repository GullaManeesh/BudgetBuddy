import axios from "axios";

const resolveApiBaseUrl = () => {
  const envBase = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (envBase) return envBase;

  if (
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("vercel.app")
  ) {
    return "https://budgetbuddy-backend-sbyh.onrender.com/api";
  }

  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
