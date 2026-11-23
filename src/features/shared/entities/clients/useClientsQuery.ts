import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchClients } from "./clients.api";

export const clientEntityKeys = {
  all: ["entities", "clients"] as const,
  list: (search?: string) =>
    [...clientEntityKeys.all, "list", search ?? ""] as const,
};

export function useClientsQuery(search?: string, enabled = true) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: clientEntityKeys.list(search),
    queryFn: () =>
      fetchClients({ page: 1, limit: 100, search: search || undefined }),
    enabled: !!accessToken && enabled,
    staleTime: 60_000,
  });
}
