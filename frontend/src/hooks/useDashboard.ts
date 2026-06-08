import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";

export function useDashboardSummary(year_month: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", year_month],
    queryFn: () => dashboardApi.summary(year_month).then((r) => r.data),
  });
}

export function useExpensesByCategory(year_month: string) {
  return useQuery({
    queryKey: ["dashboard", "expenses-by-category", year_month],
    queryFn: () => dashboardApi.expensesByCategory(year_month).then((r) => r.data),
  });
}

export function useTrend() {
  return useQuery({
    queryKey: ["dashboard", "trend"],
    queryFn: () => dashboardApi.trend().then((r) => r.data),
  });
}

export function useTopCategories(year_month: string) {
  return useQuery({
    queryKey: ["dashboard", "top-categories", year_month],
    queryFn: () => dashboardApi.topCategories(year_month).then((r) => r.data),
  });
}
