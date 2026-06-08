import type { Category, TransactionType } from "../types";
import apiClient from "./client";

export const categoriesApi = {
  list: (type?: TransactionType) =>
    apiClient.get<Category[]>("/categories", { params: { type } }),

  get: (id: string) =>
    apiClient.get<Category>(`/categories/${id}`),

  create: (data: { name: string; icon: string; color: string; type: TransactionType }) =>
    apiClient.post<Category>("/categories", data),

  update: (id: string, data: Partial<{ name: string; icon: string; color: string }>) =>
    apiClient.patch<Category>(`/categories/${id}`, data),

  archive: (id: string) =>
    apiClient.delete(`/categories/${id}`),
};
