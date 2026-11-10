import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { RateCard } from "../types";

export async function fetchRateCards(params: PaginatedListParams = {}) {
  const response = await apiClient.get("/ratecards", {
    params: { limit: 100, ...params },
  });
  return unwrapData<{ rateCards: RateCard[]; pagination: PaginationMeta }>(
    response.data,
  );
}
