import axios from "axios";
import { useAuthStore } from "../store/authStore";

const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const { refreshToken, setTokens, logout } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    if (!refreshing) {
      refreshing = axios
        .post<{ access_token: string; refresh_token: string }>("/api/v1/auth/refresh", {
          refresh_token: refreshToken,
        })
        .then((res) => {
          setTokens(res.data.access_token, res.data.refresh_token);
          return res.data.access_token;
        })
        .catch(() => {
          logout();
          throw error;
        })
        .finally(() => {
          refreshing = null;
        });
    }

    const newToken = await refreshing;
    original.headers.Authorization = `Bearer ${newToken}`;
    return apiClient(original);
  }
);

export default apiClient;
