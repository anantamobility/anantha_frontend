import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type Deployment = {
  id: string;
  vehicleId: string;
  riderId?: string | null;
  rentalId?: string | null;
  outHubId?: string | null;
  inHubId?: string | null;
  startDate: string;
  endDate?: string | null;
  startOdometer?: number | null;
  endOdometer?: number | null;
  status: string;
  reason?: string | null;
  vehicle?: {
    id: string;
    registrationNumber: string;
    make?: string | null;
    model?: string | null;
    status?: string;
  } | null;
  rider?: {
    id: string;
    riderCode?: string | null;
    fullName: string;
  } | null;
  rental?: {
    id: string;
    rentalNumber?: string | null;
    status?: string;
  } | null;
  outHub?: { id: string; name: string; hubCode?: string } | null;
  inHub?: { id: string; name: string; hubCode?: string } | null;
  createdAt?: string;
};

export type DeployOutPayload = {
  rentalId: string;
  vehicleId: string;
  outHubId: string;
  startDate?: string;
  startOdometer?: number;
  reason?: string;
};

export type DeployInPayload = {
  inHubId: string;
  endDate?: string;
  endOdometer?: number;
  vehicleReturnStatus?:
    | "IDLE"
    | "IN_SERVICE"
    | "UNDER_REPAIR"
    | "OUT_OF_SERVICE";
};

export async function listDeployments(
  params: PaginatedListParams & {
    rentalId?: string;
    vehicleId?: string;
    status?: string;
  } = {},
) {
  const response = await apiClient.get("/deployments", { params });
  return unwrapData<{
    deployments: Deployment[];
    pagination: PaginationMeta;
  }>(response.data);
}

export async function deployOut(payload: DeployOutPayload) {
  const response = await apiClient.post("/deployments/deploy-out", payload);
  return unwrapData<{ deployment: Deployment }>(response.data).deployment;
}

export async function deployIn(id: string, payload: DeployInPayload) {
  const response = await apiClient.post(`/deployments/${id}/deploy-in`, payload);
  return unwrapData<{ deployment: Deployment }>(response.data).deployment;
}
