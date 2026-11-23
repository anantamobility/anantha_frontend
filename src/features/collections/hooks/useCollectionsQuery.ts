import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { getCollection, listCollections } from "../api/collections.api";

export const collectionKeys = {
  all: ["collections"] as const,
  list: (page: number, limit: number, search: string) =>
    [...collectionKeys.all, "list", page, limit, search] as const,
  detail: (id: string) => [...collectionKeys.all, "detail", id] as const,
};

export function useCollectionsListQuery(
  page: number,
  limit: number,
  search: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: collectionKeys.list(page, limit, search),
    queryFn: () =>
      listCollections({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}

export function useCollectionDetailQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: collectionKeys.detail(id ?? ""),
    queryFn: () => getCollection(id!),
    enabled: !!accessToken && !!id,
  });
}
