import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Vehicle } from "../types";

export async function fetchVehicles(params: PaginatedListParams = {}) {
  const response = await apiClient.get("/vehicles", {
    params: { limit: 100, ...params },
  });
  return unwrapData<{ vehicles: Vehicle[]; pagination: PaginationMeta }>(response.data);
}
