import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchRolesAndPermissions } from "../api/pbac.api";

export const roleKeys = {
  all: ["pbac", "roles"] as const,
};

export function useRolesQuery(enabled = true) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: roleKeys.all,
    queryFn: fetchRolesAndPermissions,
    enabled: !!accessToken && enabled,
    staleTime: 60_000,
  });
}
