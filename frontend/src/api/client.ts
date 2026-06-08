import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  // JWT attach — will be implemented with authStore
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Token refresh logic — will be implemented
    return Promise.reject(error);
  }
);

export default apiClient;
