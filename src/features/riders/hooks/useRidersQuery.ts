import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listRiders } from "../api/riders.api";

export const riderKeys = {
  all: ["riders"] as const,
  list: (page: number, limit: number, search: string) =>
    [...riderKeys.all, "list", page, limit, search] as const,
};

export function useRidersListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: riderKeys.list(page, limit, search),
    queryFn: () => listRiders({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}
