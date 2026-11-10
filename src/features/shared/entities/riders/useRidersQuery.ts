import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchRiders } from "./riders.api";

export const riderEntityKeys = {
  all: ["entities", "riders"] as const,
  list: (search?: string) => [...riderEntityKeys.all, "list", search ?? ""] as const,
};

export function useRidersQuery(search?: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: riderEntityKeys.list(search),
    queryFn: () => fetchRiders({ page: 1, limit: 100, search: search || undefined }),
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}
