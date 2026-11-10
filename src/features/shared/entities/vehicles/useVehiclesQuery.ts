import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchVehicles } from "./vehicles.api";

export const vehicleEntityKeys = {
  all: ["entities", "vehicles"] as const,
  list: (search?: string) => [...vehicleEntityKeys.all, "list", search ?? ""] as const,
};

export function useVehiclesQuery(search?: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: vehicleEntityKeys.list(search),
    queryFn: () => fetchVehicles({ page: 1, limit: 100, search: search || undefined }),
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}
