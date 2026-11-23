import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listClients } from "../api/clients.api";

export const clientKeys = {
  all: ["clients"] as const,
  list: (page: number, limit: number, search: string) =>
    [...clientKeys.all, "list", page, limit, search] as const,
};

export function useClientsListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: clientKeys.list(page, limit, search),
    queryFn: () => listClients({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}
