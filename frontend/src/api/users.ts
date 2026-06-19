import type { User } from "../types";
import apiClient from "./client";

interface UpdateUserPayload {
  full_name?: string | null;
  email?: string;
  base_currency?: string;
}

interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  getMe: () => apiClient.get<User>("/users/me"),
  updateMe: (data: UpdateUserPayload) => apiClient.patch<User>("/users/me", data),
  changePassword: (data: ChangePasswordPayload) =>
    apiClient.patch("/users/me/password", data),
};
