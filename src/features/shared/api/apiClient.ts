import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/features/shared/config/env";

type TokenHandlers = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  onAuthFailure: () => void;
};

let handlers: TokenHandlers = {
  getAccessToken: () => null,
  setAccessToken: () => undefined,
  onAuthFailure: () => undefined,
};

export function setApiAuthHandlers(next: TokenHandlers) {
  handlers = next;
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = handlers.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post(
      `${env.apiBaseUrl}/auth/tokenRefresh`,
      {},
      { withCredentials: true },
    );
    const token = (response.data?.accessToken as string | undefined) ?? null;
    handlers.setAccessToken(token);
    return token;
  } catch {
    handlers.setAccessToken(null);
    handlers.onAuthFailure();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const token = await refreshPromise;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      }
    }

    return Promise.reject(error);
  },
);

/** Unwrap `{ success, data }` domain envelope. Auth routes do not use this. */
export function unwrapData<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success: boolean }).success === true &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }
  throw new Error("Unexpected API response shape");
}
