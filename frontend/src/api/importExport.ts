import apiClient from "./client";
import type { TransactionFilters } from "./transactions";

export const importExportApi = {
  exportCsv: (filters?: TransactionFilters) =>
    apiClient.get("/import-export/export", {
      params: filters,
      responseType: "blob",
    }),

  importCsv: (
    file: File,
    dry_run = true,
    colMapping?: {
      col_date?: string;
      col_type?: string;
      col_amount?: string;
      col_currency?: string;
      col_description?: string;
    },
  ) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{ created: number; skipped: number; errors: string[] }>(
      "/import-export/import",
      form,
      { params: { dry_run, ...colMapping }, headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};
