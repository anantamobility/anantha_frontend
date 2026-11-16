import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type UserRole = { id: string; name: string };

export type AppUser = {
  id: string;
  email?: string | null;
  phoneNumber: string;
  status: string;
  roleId: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  role?: UserRole;
  staffProfile?: { id: string; fullName: string } | null;
  riderProfile?: { id: string; fullName: string } | null;
};

export async function listUsers(params: PaginatedListParams & { status?: string }) {
  const response = await apiClient.get("/users", { params });
  return unwrapData<{ users: AppUser[]; pagination: PaginationMeta }>(response.data);
}

export async function updateUser(
  id: string,
  payload: { phoneNumber?: string; email?: string | null },
) {
  const response = await apiClient.patch(`/users/${id}`, payload);
  return unwrapData<{ user: AppUser }>(response.data).user;
}

export async function assignUserRole(
  id: string,
  payload: { roleId: string; reason?: string },
) {
  const response = await apiClient.patch(`/users/${id}/role`, payload);
  return unwrapData<{ user: AppUser }>(response.data).user;
}

export async function changeUserStatus(
  id: string,
  payload: { status: "ONBOARDING" | "ACTIVE" | "SUSPENDED"; reason?: string },
) {
  const response = await apiClient.patch(`/users/${id}/status`, payload);
  return unwrapData<{ user: AppUser }>(response.data).user;
}

export async function revokeUserSessions(id: string) {
  const response = await apiClient.post(`/users/${id}/revoke-sessions`);
  return unwrapData(response.data);
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/users/${id}`);
}
