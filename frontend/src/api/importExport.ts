import apiClient from "./client";
import type { TransactionFilters } from "./transactions";

export const importExportApi = {
  exportCsv: (filters?: TransactionFilters) =>
    apiClient.get("/import-export/export", {
      params: filters,
      responseType: "blob",
    }),

  importCsv: (file: File, dry_run = true) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<{ created: number; skipped: number; errors: string[] }>(
      "/import-export/import",
      form,
      { params: { dry_run }, headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};
