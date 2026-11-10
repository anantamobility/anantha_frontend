import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listHubs } from "../api/hubs.api";

export const hubKeys = {
  all: ["hubs"] as const,
  list: (page: number, limit: number, search: string) =>
    [...hubKeys.all, "list", page, limit, search] as const,
};

export function useHubsListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: hubKeys.list(page, limit, search),
    queryFn: () => listHubs({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}
