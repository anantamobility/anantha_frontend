import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Hub } from "../types";

export async function fetchHubs(params: PaginatedListParams = {}) {
  const response = await apiClient.get("/hubs", { params: { limit: 200, ...params } });
  return unwrapData<{ hubs: Hub[]; pagination: PaginationMeta }>(response.data);
}
