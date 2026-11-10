import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import {
  getRental,
  listRentalDues,
  listRentals,
} from "../api/rentals.api";

export const rentalKeys = {
  all: ["rentals"] as const,
  list: (page: number, limit: number, search: string, status: string) =>
    [...rentalKeys.all, "list", page, limit, search, status] as const,
  detail: (id: string) => [...rentalKeys.all, "detail", id] as const,
  dues: (id: string) => [...rentalKeys.all, "dues", id] as const,
};

export function useRentalsListQuery(
  page: number,
  limit: number,
  search: string,
  status: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.list(page, limit, search, status),
    queryFn: () =>
      listRentals({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
      }),
    enabled: !!accessToken,
  });
}

export function useRentalDetailQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.detail(id ?? ""),
    queryFn: () => getRental(id as string),
    enabled: !!accessToken && !!id,
  });
}

export function useRentalDuesQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.dues(id ?? ""),
    queryFn: () => listRentalDues(id as string),
    enabled: !!accessToken && !!id,
  });
}
