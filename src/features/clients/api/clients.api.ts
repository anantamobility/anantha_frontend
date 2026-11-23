import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Client, Collection, RentalDue } from "@/features/shared/entities";

export type ClientPayload = {
  clientCode?: string;
  name: string;
  companyName?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
};

export type ClientStatusPayload = {
  isActive: boolean;
  reason?: string;
};

export async function listClients(params: PaginatedListParams) {
  const response = await apiClient.get("/clients", { params });
  return unwrapData<{ clients: Client[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getClient(id: string) {
  const response = await apiClient.get(`/clients/${id}`);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function createClient(payload: ClientPayload) {
  const response = await apiClient.post("/clients", payload);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function updateClient(id: string, payload: Partial<ClientPayload>) {
  const response = await apiClient.patch(`/clients/${id}`, payload);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function updateClientStatus(id: string, payload: ClientStatusPayload) {
  const response = await apiClient.patch(`/clients/${id}/status`, payload);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function deleteClient(id: string) {
  await apiClient.delete(`/clients/${id}`);
}

export async function listClientDues(id: string, params: PaginatedListParams = {}) {
  const response = await apiClient.get(`/clients/${id}/dues`, { params });
  return unwrapData<{ dues: RentalDue[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function listClientCollections(
  id: string,
  params: PaginatedListParams = {},
) {
  const response = await apiClient.get(`/clients/${id}/collections`, { params });
  return unwrapData<{ collections: Collection[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function generateClientDues(
  id: string,
  payload: { throughDate?: string } = {},
) {
  const response = await apiClient.post(`/clients/${id}/dues/generate`, payload);
  return unwrapData<{ created?: number; dues?: RentalDue[] }>(response.data);
}
