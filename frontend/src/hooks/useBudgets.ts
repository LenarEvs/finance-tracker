import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "../api/budgets";

export function useBudgets(year_month?: string) {
  return useQuery({
    queryKey: ["budgets", year_month],
    queryFn: () => budgetsApi.list(year_month).then((r) => r.data),
  });
}

export function useBudgetProgress(year_month: string) {
  return useQuery({
    queryKey: ["budgets", "progress", year_month],
    queryFn: () => budgetsApi.progress(year_month).then((r) => r.data),
    enabled: !!year_month,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: string }) =>
      budgetsApi.update(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: budgetsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
