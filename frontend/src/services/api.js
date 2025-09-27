import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileAPI = {
  getProfile: () => api.get("/profile"),
  updateProfile: (data) => api.put("/profile", data),
  uploadAvatar: (formData) =>
    api.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePrivacySettings: (settings) => api.put("/profile/privacy", settings),
  setup2FA: () => api.post("/profile/2fa/setup"),
  verify2FA: (token) => api.post("/profile/2fa/verify", { token }),
  disable2FA: () => api.delete("/profile/2fa"),
  getAnalytics: (period) => api.get(`/profile/analytics?period=${period}`),
  followUser: (userId) => api.post(`/profile/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/profile/follow/${userId}`),
  getPublicProfile: (username) => api.get(`/profile/public/${username}`),
};

export const aiAPI = {
  getAIPreferences: () => api.get("/ai/preferences"),
  updateAIPreferences: (preferences) => api.put("/ai/preferences", preferences),
  getChatHistory: (limit, offset) =>
    api.get(`/ai/history?limit=${limit}&offset=${offset}`),
  exportChatHistory: () => api.get("/ai/history/export"),
};

export default api;
