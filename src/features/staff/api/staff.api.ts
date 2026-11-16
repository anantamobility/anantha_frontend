import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type StaffMember = {
  id: string;
  fullName: string;
  employeeCode?: string | null;
  gender: string;
  department?: string | null;
  jobTitle?: string | null;
  hubId?: string | null;
  status: string;
  user?: {
    id: string;
    email?: string | null;
    phoneNumber: string;
  } | null;
};

export type StaffCreatePayload = {
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  phoneNumber: string;
  email?: string | null;
  password: string;
  roleId?: string;
  roleName?: string;
  hubId?: string | null;
  department?: string | null;
  jobTitle?: string | null;
};

export type StaffUpdatePayload = {
  fullName?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  hubId?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

export async function listStaff(params: PaginatedListParams) {
  const response = await apiClient.get("/staff", { params });
  return unwrapData<{ staff: StaffMember[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function createStaff(payload: StaffCreatePayload) {
  const response = await apiClient.post("/staff", payload);
  return unwrapData<{ staff: StaffMember }>(response.data).staff;
}

export async function updateStaff(id: string, payload: StaffUpdatePayload) {
  const response = await apiClient.patch(`/staff/${id}`, payload);
  return unwrapData<{ staff: StaffMember }>(response.data).staff;
}

export async function deleteStaff(id: string) {
  await apiClient.delete(`/staff/${id}`);
}
