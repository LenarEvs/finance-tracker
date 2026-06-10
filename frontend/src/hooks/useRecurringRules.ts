import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recurringRulesApi } from "../api/recurringRules";

export function useRecurringRules() {
  return useQuery({
    queryKey: ["recurring-rules"],
    queryFn: () => recurringRulesApi.list().then((r) => r.data),
  });
}

export function useCreateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recurringRulesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

export function useUpdateRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof recurringRulesApi.update>[1] }) =>
      recurringRulesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

export function useDeleteRecurringRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recurringRulesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}
