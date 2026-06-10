import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories";
import type { TransactionType } from "../types";

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => categoriesApi.list(type).then((r) => r.data),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof categoriesApi.update>[1] }) =>
      categoriesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.archive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}
