import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import {
  getRental,
  getRentalDeposit,
  listRentalCollections,
  listRentalDues,
  listRentals,
} from "../api/rentals.api";

export const rentalKeys = {
  all: ["rentals"] as const,
  list: (page: number, limit: number, search: string) =>
    [...rentalKeys.all, "list", page, limit, search] as const,
  detail: (id: string) => [...rentalKeys.all, "detail", id] as const,
  dues: (id: string) => [...rentalKeys.all, "dues", id] as const,
  collections: (id: string) => [...rentalKeys.all, "collections", id] as const,
  deposit: (id: string) => [...rentalKeys.all, "deposit", id] as const,
};

export function useRentalsListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.list(page, limit, search),
    queryFn: () => listRentals({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}

export function useRentalDetailQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.detail(id ?? ""),
    queryFn: () => getRental(id!),
    enabled: !!accessToken && !!id,
  });
}

export function useRentalDuesQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.dues(id ?? ""),
    queryFn: () => listRentalDues(id!, { page: 1, limit: 50 }),
    enabled: !!accessToken && !!id,
  });
}

export function useRentalCollectionsQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.collections(id ?? ""),
    queryFn: () => listRentalCollections(id!, { page: 1, limit: 50 }),
    enabled: !!accessToken && !!id,
  });
}

export function useRentalDepositQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rentalKeys.deposit(id ?? ""),
    queryFn: () => getRentalDeposit(id!),
    enabled: !!accessToken && !!id,
    retry: false,
  });
}
