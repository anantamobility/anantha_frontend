import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { RateCard } from "@/features/shared/entities";

export type RateCardPayload = {
  name: string;
  code?: string;
  rentalType?: "B2C" | "B2B" | null;
  billingFrequency?: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | null;
  dailyRate: string;
  weeklyRate?: string | null;
  securityDeposit?: string | null;
  currency?: string;
  vehicleCategory?: string | null;
  effectiveFrom?: string;
  isActive?: boolean;
};

export async function listRateCards(params: PaginatedListParams) {
  const response = await apiClient.get("/ratecards", { params });
  return unwrapData<{ rateCards: RateCard[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function createRateCard(payload: RateCardPayload) {
  const response = await apiClient.post("/ratecards", payload);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function updateRateCard(id: string, payload: Partial<RateCardPayload>) {
  const response = await apiClient.patch(`/ratecards/${id}`, payload);
  return unwrapData<{ rateCard: RateCard }>(response.data).rateCard;
}

export async function deleteRateCard(id: string) {
  await apiClient.delete(`/ratecards/${id}`);
}

export type AssignRateCardPayload = {
  clientId: string;
  rateCardId: string;
  validFrom?: string;
  reason?: string | null;
};

export async function assignRateCardToClient(payload: AssignRateCardPayload) {
  const response = await apiClient.post("/ratecard-assignments", payload);
  return unwrapData(response.data);
}
