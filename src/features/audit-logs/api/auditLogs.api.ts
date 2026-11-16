import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type AuditLog = {
  id: string;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  status: string;
  summary?: string | null;
  createdAt: string;
};

export async function listAuditLogs(
  params: PaginatedListParams & {
    resource?: string;
    action?: string;
    status?: "SUCCESS" | "FAILURE";
  },
) {
  const response = await apiClient.get("/audit-logs", { params });
  return unwrapData<{ auditLogs: AuditLog[]; pagination: PaginationMeta }>(
    response.data,
  );
}
