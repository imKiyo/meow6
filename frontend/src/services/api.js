import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Favorites API methods
export const favoritesAPI = {
  toggle: (gifId) => api.post(`/favorites/${gifId}`),
  getFavorites: (params) => api.get("/favorites", { params }),
  checkFavorites: (gifIds) =>
    api.get("/favorites/check", { params: { gifIds: gifIds.join(",") } }),
};

export default api;
