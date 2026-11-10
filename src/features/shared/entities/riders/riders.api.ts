import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Rider } from "../types";

export async function fetchRiders(params: PaginatedListParams = {}) {
  const response = await apiClient.get("/riders", {
    params: { limit: 100, ...params },
  });
  return unwrapData<{ riders: Rider[]; pagination: PaginationMeta }>(response.data);
}
