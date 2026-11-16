import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listAuditLogs } from "../api/auditLogs.api";

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (page: number, search: string, resource: string) =>
    [...auditLogKeys.all, "list", page, search, resource] as const,
};

export function useAuditLogsListQuery(
  page: number,
  limit: number,
  search: string,
  resource: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: auditLogKeys.list(page, search, resource),
    queryFn: () =>
      listAuditLogs({
        page,
        limit,
        search: search || undefined,
        resource: resource || undefined,
      }),
    enabled: !!accessToken,
  });
}
