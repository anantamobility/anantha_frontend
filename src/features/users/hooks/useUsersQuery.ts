import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listUsers } from "../api/users.api";

export const userKeys = {
  all: ["users"] as const,
  list: (page: number, search: string) =>
    [...userKeys.all, "list", page, search] as const,
};

export function useUsersListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: userKeys.list(page, search),
    queryFn: () => listUsers({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
  });
}
