import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Rider } from "@/features/shared/entities";

export type RiderCreatePayload = {
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  password: string;
  rentalType: "B2C" | "B2B";
  b2cMode?: "AML_RIDER" | "INDIVIDUAL_RIDER" | null;
  b2bRiderMgmt?: "CLIENT_MANAGED" | "AML_MANAGED" | null;
  clientId?: string | null;
  hubId?: string | null;
  dateOfBirth?: string | null;
  policeVerificationValidUpto?: string | null;
  backgroundVerificationExpiryDate?: string | null;
};

export type RiderUpdatePayload = {
  fullName?: string;
  rentalType?: "B2C" | "B2B";
  b2cMode?: "AML_RIDER" | "INDIVIDUAL_RIDER" | null;
  b2bRiderMgmt?: "CLIENT_MANAGED" | "AML_MANAGED" | null;
  clientId?: string | null;
  hubId?: string | null;
  dateOfBirth?: string | null;
  policeVerificationValidUpto?: string | null;
  backgroundVerificationExpiryDate?: string | null;
};

export type RiderStatusPayload = {
  status: "ONBOARDING" | "ACTIVE" | "SUSPENDED" | "INACTIVE" | "TERMINATED";
  reason?: string;
  notes?: string;
};

export type RiderDocument = {
  id: string;
  documentType: string;
  title: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
  createdAt?: string;
};

export async function listRiders(params: PaginatedListParams) {
  const response = await apiClient.get("/riders", { params });
  return unwrapData<{ riders: Rider[]; pagination: PaginationMeta }>(response.data);
}

export async function getRider(id: string) {
  const response = await apiClient.get(`/riders/${id}`);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function createRider(payload: RiderCreatePayload) {
  const response = await apiClient.post("/riders", payload);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function updateRider(id: string, payload: RiderUpdatePayload) {
  const response = await apiClient.patch(`/riders/${id}`, payload);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function updateRiderStatus(id: string, payload: RiderStatusPayload) {
  const response = await apiClient.patch(`/riders/${id}/status`, payload);
  return unwrapData<{ rider: Rider }>(response.data).rider;
}

export async function deleteRider(id: string) {
  await apiClient.delete(`/riders/${id}`);
}

export async function listRiderDocuments(riderId: string, params: PaginatedListParams = {}) {
  const response = await apiClient.get(`/riders/${riderId}/documents`, { params });
  return unwrapData<{ documents: RiderDocument[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function uploadRiderDocument(
  riderId: string,
  file: File,
  meta: {
    documentType: string;
    title: string;
    issueDate?: string | null;
    expiryDate?: string | null;
    notes?: string;
  },
) {
  const form = new FormData();
  form.append("file", file);
  form.append("documentType", meta.documentType);
  form.append("title", meta.title);
  if (meta.issueDate) form.append("issueDate", meta.issueDate);
  if (meta.expiryDate) form.append("expiryDate", meta.expiryDate);
  if (meta.notes) form.append("notes", meta.notes);

  const response = await apiClient.post(`/riders/${riderId}/documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapData<{ document: RiderDocument }>(response.data).document;
}

export async function downloadRiderDocument(
  riderId: string,
  documentId: string,
  filename: string,
) {
  const response = await apiClient.get(
    `/riders/${riderId}/documents/${documentId}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function deleteRiderDocument(riderId: string, documentId: string) {
  await apiClient.delete(`/riders/${riderId}/documents/${documentId}`);
}
