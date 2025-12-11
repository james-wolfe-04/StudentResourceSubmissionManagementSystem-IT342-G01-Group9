// src/api/axios.js
import axios from "axios";

// Configure backend URL via env; fallback to local dev server
const baseURL =
  process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, "") ||
  (window.location.hostname === "localhost"
    ? "http://localhost:8080/api"
    : "/api");

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

// Add JWT token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default api;
