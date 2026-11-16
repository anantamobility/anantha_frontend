import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { RateCard } from "@/features/shared/entities";

export type RateCardPayload = {
  name: string;
  code?: string;
  description?: string | null;
  rentalType?: "B2C" | "B2B" | null;
  dailyRate: string;
  weeklyRate?: string | null;
  fortnightlyRate?: string | null;
  monthlyRate?: string | null;
  securityDeposit?: string | null;
  vehicleCategory?: string | null;
  effectiveFrom: string;
  effectiveTo?: string | null;
  terms?: unknown;
  isActive?: boolean;
};

export async function listRateCards(params: PaginatedListParams) {
  const response = await apiClient.get("/ratecards", { params });
  return unwrapData<{ rateCards: RateCard[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getRateCard(id: string) {
  const response = await apiClient.get(`/ratecards/${id}`);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function createRateCard(payload: RateCardPayload) {
  const response = await apiClient.post("/ratecards", payload);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function updateRateCard(id: string, payload: Partial<RateCardPayload>) {
  const response = await apiClient.patch(`/ratecards/${id}`, payload);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function updateRateCardStatus(
  id: string,
  payload: { isActive: boolean; reason?: string },
) {
  const response = await apiClient.patch(`/ratecards/${id}/status`, payload);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function deleteRateCard(id: string) {
  await apiClient.delete(`/ratecards/${id}`);
}
