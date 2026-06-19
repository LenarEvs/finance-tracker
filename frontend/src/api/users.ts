import type { User } from "../types";
import apiClient from "./client";

interface UpdateUserPayload {
  full_name?: string | null;
  email?: string;
}

interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

interface ChangeCurrencyPayload {
  base_currency: string;
  conversion_rate: string;
}

export const usersApi = {
  getMe: () => apiClient.get<User>("/users/me"),
  updateMe: (data: UpdateUserPayload) => apiClient.patch<User>("/users/me", data),
  changePassword: (data: ChangePasswordPayload) =>
    apiClient.patch("/users/me/password", data),
  changeCurrency: (data: ChangeCurrencyPayload) =>
    apiClient.patch<User>("/users/me/currency", data),
};
