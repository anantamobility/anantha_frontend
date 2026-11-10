import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Client } from "@/features/shared/entities";

export type ClientPayload = {
  type: "INDIVIDUAL" | "CORPORATE";
  name: string;
  clientCode?: string;
  companyName?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  isActive?: boolean;
};

export async function listClients(params: PaginatedListParams) {
  const response = await apiClient.get("/clients", { params });
  return unwrapData<{ clients: Client[]; pagination: PaginationMeta }>(response.data);
}

export async function createClient(payload: ClientPayload) {
  const response = await apiClient.post("/clients", payload);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function updateClient(id: string, payload: Partial<ClientPayload>) {
  const response = await apiClient.patch(`/clients/${id}`, payload);
  return unwrapData<{ client: Client }>(response.data).client;
}

export async function deleteClient(id: string) {
  await apiClient.delete(`/clients/${id}`);
}
