import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import {
  listActiveRentalsForCollection,
  listCollections,
} from "../api/collections.api";

export const collectionKeys = {
  all: ["collections"] as const,
  list: (page: number, limit: number, search: string, status: string) =>
    [...collectionKeys.all, "list", page, limit, search, status] as const,
  activeRentals: [...["collections"], "active-rentals"] as const,
};

export function useCollectionsListQuery(
  page: number,
  limit: number,
  search: string,
  status: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: collectionKeys.list(page, limit, search, status),
    queryFn: () =>
      listCollections({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
      }),
    enabled: !!accessToken,
  });
}

export function useActiveRentalsForCollectionQuery(enabled: boolean) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: collectionKeys.activeRentals,
    queryFn: listActiveRentalsForCollection,
    enabled: !!accessToken && enabled,
  });
}
