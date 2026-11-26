import { apiClient, unwrapData } from "@/features/shared/api/apiClient";

export type AccountStatus = "ONBOARDING" | "ACTIVE" | "SUSPENDED";

export type LinkedUserAccount = {
  id: string;
  email?: string | null;
  phoneNumber: string;
  status?: AccountStatus | string;
  role?: { id: string; name: string } | null;
};

export type UpdateUserPayload = {
  phoneNumber?: string;
  email?: string | null;
};

export type AssignUserRolePayload = {
  roleId: string;
  reason?: string;
};

export type ChangeUserStatusPayload = {
  status: AccountStatus;
  reason?: string;
};

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const response = await apiClient.patch(`/users/${id}`, payload);
  return unwrapData<{ user: LinkedUserAccount }>(response.data).user;
}

export async function assignUserRole(id: string, payload: AssignUserRolePayload) {
  const response = await apiClient.patch(`/users/${id}/role`, payload);
  return unwrapData<{ user: LinkedUserAccount }>(response.data).user;
}

export async function changeUserStatus(
  id: string,
  payload: ChangeUserStatusPayload,
) {
  const response = await apiClient.patch(`/users/${id}/status`, payload);
  return unwrapData<{ user: LinkedUserAccount }>(response.data).user;
}

export async function revokeUserSessions(id: string) {
  const response = await apiClient.post(`/users/${id}/revoke-sessions`);
  return unwrapData(response.data);
}

export async function adminResetPassword(
  userId: string,
  payload: { newPassword: string },
) {
  const response = await apiClient.post(
    `/auth/reset-password/${userId}`,
    payload,
  );
  return unwrapData(response.data);
}
