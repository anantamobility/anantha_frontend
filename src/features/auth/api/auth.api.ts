import { apiClient } from "@/features/shared/api/apiClient";
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
