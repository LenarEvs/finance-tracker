import { useQuery } from "@tanstack/react-query";
import { auditLogApi, type AuditLogFilters } from "../api/auditLog";

export function useAuditLog(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ["audit-log", filters],
    queryFn: () => auditLogApi.list(filters).then((r) => r.data),
  });
}
