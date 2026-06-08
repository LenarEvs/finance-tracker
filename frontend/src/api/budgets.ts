import type { Budget, BudgetProgress } from "../types";
import apiClient from "./client";

export const budgetsApi = {
  list: (year_month?: string) =>
    apiClient.get<Budget[]>("/budgets", { params: { year_month } }),

  get: (id: string) =>
    apiClient.get<Budget>(`/budgets/${id}`),

  create: (data: { category_id: string; year_month: string; amount: string }) =>
    apiClient.post<Budget>("/budgets", data),

  update: (id: string, amount: string) =>
    apiClient.put<Budget>(`/budgets/${id}`, { amount }),

  remove: (id: string) =>
    apiClient.delete(`/budgets/${id}`),

  progress: (year_month: string) =>
    apiClient.get<BudgetProgress[]>("/budgets/progress", { params: { year_month } }),
};
