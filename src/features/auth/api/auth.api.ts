import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { AuthUser } from "@/features/shared/context/authContext";

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

export async function loginRequest(phone: string, password: string) {
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    phone,
    password,
  });
  return response.data;
}

export async function logoutRequest() {
  await apiClient.post("/auth/logout");
}

/** Flat `{ message }` response — not the domain envelope. */
export async function changePasswordRequest(oldpassword: string, newPassword: string) {
  const response = await apiClient.post<{ message: string }>("/auth/change-password", {
    oldpassword,
    newPassword,
  });
  return response.data;
}

export async function adminResetPassword(userId: string, newPassword: string) {
  const response = await apiClient.post(`/auth/reset-password/${userId}`, {
    newPassword,
  });
  return unwrapData<{
    message: string;
    userId: string;
    sessionsRevoked: boolean;
  }>(response.data);
}
