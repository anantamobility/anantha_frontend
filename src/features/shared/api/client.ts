import axios, { isAxiosError } from "axios";

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; code?: string; error?: { message?: string } }
      | undefined;
    return data?.message || data?.error?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export { axios, isAxiosError };
