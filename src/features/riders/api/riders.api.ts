import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Rider } from "@/features/shared/entities";

export type RiderPayload = {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  rentalType: "B2C" | "B2B";
  b2cMode?: "AML_RIDER" | "INDIVIDUAL_RIDER" | null;
  b2bRiderMgmt?: "CLIENT_MANAGED" | "AML_MANAGED" | null;
  clientId?: string | null;
  hubId?: string | null;
};

export async function listRiders(params: PaginatedListParams) {
  const response = await apiClient.get("/riders", { params });
  return unwrapData<{ riders: Rider[]; pagination: PaginationMeta }>(response.data);
}

export async function createRider(payload: RiderPayload) {
  const response = await apiClient.post("/riders", payload);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function updateRider(id: string, payload: Partial<RiderPayload>) {
  const response = await apiClient.patch(`/riders/${id}`, payload);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function deleteRider(id: string) {
  await apiClient.delete(`/riders/${id}`);
}
