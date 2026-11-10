import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Client } from "../types";

export async function fetchClients(params: PaginatedListParams = {}) {
  const response = await apiClient.get("/clients", {
    params: { limit: 100, ...params },
  });
  return unwrapData<{ clients: Client[]; pagination: PaginationMeta }>(response.data);
}
