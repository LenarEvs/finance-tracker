import type { DashboardSummary, ExpenseByCategory, MonthlyTrend, TopCategory } from "../types";
import apiClient from "./client";

export const dashboardApi = {
  summary: (year_month: string) =>
    apiClient.get<DashboardSummary>("/dashboard/summary", { params: { year_month } }),

  expensesByCategory: (year_month: string) =>
    apiClient.get<ExpenseByCategory[]>("/dashboard/expenses-by-category", { params: { year_month } }),

  trend: () =>
    apiClient.get<MonthlyTrend[]>("/dashboard/trend"),

  topCategories: (year_month: string) =>
    apiClient.get<TopCategory[]>("/dashboard/top-categories", { params: { year_month } }),
};
