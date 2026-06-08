import type { RecurringRule, TransactionType } from "../types";
import apiClient from "./client";

export const recurringRulesApi = {
  list: () =>
    apiClient.get<RecurringRule[]>("/recurring-rules"),

  get: (id: string) =>
    apiClient.get<RecurringRule>(`/recurring-rules/${id}`),

  create: (data: {
    category_id: string;
    type: TransactionType;
    amount: string;
    currency: string;
    description?: string;
    day_of_month: number;
  }) => apiClient.post<RecurringRule>("/recurring-rules", data),

  update: (id: string, data: Partial<{ amount: string; day_of_month: number; is_active: boolean; description: string }>) =>
    apiClient.patch<RecurringRule>(`/recurring-rules/${id}`, data),

  remove: (id: string) =>
    apiClient.delete(`/recurring-rules/${id}`),
};
