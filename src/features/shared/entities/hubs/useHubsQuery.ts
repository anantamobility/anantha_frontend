import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchHubs } from "./hubs.api";

export const hubEntityKeys = {
  all: ["entities", "hubs"] as const,
  list: (search?: string) => [...hubEntityKeys.all, "list", search ?? ""] as const,
};

export function useHubsQuery(search?: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: hubEntityKeys.list(search),
    queryFn: () => fetchHubs({ page: 1, limit: 200, search: search || undefined }),
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}
