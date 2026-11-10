import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type Rental = {
  id: string;
  rentalNumber: string;
  rentalType: string;
  status: string;
  clientId: string;
  riderId?: string | null;
  hubId?: string | null;
  rateCardId?: string | null;
  startDate: string;
  expectedEndDate?: string | null;
  collectionPeriod: string;
  currency: string;
  securityDepositRequired?: string | number;
  client?: { id: string; name: string; clientCode?: string };
  rider?: { id: string; fullName: string; phoneNumber?: string } | null;
  hub?: { id: string; name: string; code?: string } | null;
};

export type RentalDue = {
  id: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amountDue: string | number;
  amountCollected: string | number;
  outstandingAmount: string | number;
  status: string;
};

export type CreateRentalPayload = {
  rentalType: "B2C" | "B2B";
  b2cMode?: "AML_RIDER" | "INDIVIDUAL_RIDER" | null;
  b2bRiderMgmt?: "CLIENT_MANAGED" | "AML_MANAGED" | null;
  clientId: string;
  riderId?: string | null;
  hubId?: string | null;
  vehicleId?: string | null;
  rateCardId?: string | null;
  startDate: string;
  expectedEndDate?: string | null;
  billingFrequency?: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | null;
  collectionPeriod: "WEEKLY" | "EVERY_15_DAYS" | "MONTHLY";
  securityDepositAmount: string;
  currency?: string;
};

export async function listRentals(
  params: PaginatedListParams & { status?: string },
) {
  const response = await apiClient.get("/rentals", { params });
  return unwrapData<{ rentals: Rental[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getRental(id: string) {
  const response = await apiClient.get(`/rentals/${id}`);
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function createRental(payload: CreateRentalPayload) {
  const response = await apiClient.post("/rentals", payload);
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function assignVehicle(id: string, vehicleId: string) {
  const response = await apiClient.patch(`/rentals/${id}/assign-vehicle`, {
    vehicleId,
  });
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function activateRental(id: string) {
  const response = await apiClient.patch(`/rentals/${id}/activate`, {});
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function closeRental(id: string) {
  const response = await apiClient.patch(`/rentals/${id}/close`, {});
  return unwrapData<{ rental: Rental }>(response.data).rental;
}

export async function listRentalDues(id: string) {
  const response = await apiClient.get(`/rentals/${id}/dues`, {
    params: { page: 1, limit: 50 },
  });
  return unwrapData<{ dues: RentalDue[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function generateRentalDues(id: string) {
  const response = await apiClient.post(`/rentals/${id}/dues/generate`, {});
  return unwrapData(response.data);
}
