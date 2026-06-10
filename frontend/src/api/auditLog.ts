import type { AuditLog } from "../types";
import apiClient from "./client";

export interface AuditLogFilters {
  entity_type?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const auditLogApi = {
  list: (filters?: AuditLogFilters) =>
    apiClient.get<AuditLog[]>("/audit-log", { params: filters }),

  get: (id: number) =>
    apiClient.get<AuditLog>(`/audit-log/${id}`),
};
