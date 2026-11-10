import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Vehicle } from "@/features/shared/entities";

export type VehiclePayload = {
  registrationNumber: string;
  hubId?: string | null;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  isActive?: boolean;
};

export async function listVehicles(params: PaginatedListParams) {
  const response = await apiClient.get("/vehicles", { params });
  return unwrapData<{ vehicles: Vehicle[]; pagination: PaginationMeta }>(response.data);
}

export async function createVehicle(payload: VehiclePayload) {
  const response = await apiClient.post("/vehicles", payload);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function updateVehicle(id: string, payload: Partial<VehiclePayload>) {
  const response = await apiClient.patch(`/vehicles/${id}`, payload);
  return unwrapData<{ vehicle: Vehicle }>(response.data).vehicle;
}

export async function deleteVehicle(id: string) {
  await apiClient.delete(`/vehicles/${id}`);
}
