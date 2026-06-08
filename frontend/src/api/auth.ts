import type { TokenResponse } from "../types";
import apiClient from "./client";

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    apiClient.post<TokenResponse>("/auth/register", { email, password, full_name }),

  login: (email: string, password: string) =>
    apiClient.post<TokenResponse>("/auth/login", { email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post<TokenResponse>("/auth/refresh", { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post("/auth/logout", { refresh_token }),
};
