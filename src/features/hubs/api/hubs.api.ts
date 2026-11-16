import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Hub } from "@/features/shared/entities";

export type HubPayload = {
  name: string;
  city: string;
  state: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  isActive?: boolean;
};

export async function listHubs(params: PaginatedListParams) {
  const response = await apiClient.get("/hubs", { params });
  return unwrapData<{ hubs: Hub[]; pagination: PaginationMeta }>(response.data);
}

export async function createHub(payload: HubPayload) {
  const response = await apiClient.post("/hubs", payload);
  return unwrapData<{ hub: Hub }>(response.data).hub;
}

export async function updateHub(id: string, payload: Partial<HubPayload>) {
  const response = await apiClient.patch(`/hubs/${id}`, payload);
  return unwrapData<{ hub: Hub }>(response.data).hub;
}

export async function deleteHub(id: string) {
  await apiClient.delete(`/hubs/${id}`);
}
