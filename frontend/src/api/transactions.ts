import type { Page, Transaction, TransactionType } from "../types";
import apiClient from "./client";

export interface TransactionFilters {
  from?: string;
  to?: string;
  category_id?: string;
  type?: TransactionType;
  currency?: string;
  amount_min?: number;
  amount_max?: number;
  page?: number;
  limit?: number;
}

export const transactionsApi = {
  list: (filters?: TransactionFilters) =>
    apiClient.get<Page<Transaction>>("/transactions", { params: filters }),

  get: (id: string) =>
    apiClient.get<Transaction>(`/transactions/${id}`),

  create: (data: Omit<Transaction, "id" | "user_id" | "is_recurring_instance" | "recurring_rule_id" | "created_at" | "updated_at">) =>
    apiClient.post<Transaction>("/transactions", data),

  update: (id: string, data: Partial<Transaction>) =>
    apiClient.patch<Transaction>(`/transactions/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/transactions/${id}`),
};
