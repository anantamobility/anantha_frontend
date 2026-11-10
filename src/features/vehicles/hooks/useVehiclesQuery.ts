import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listVehicles } from "../api/vehicles.api";

export const vehicleKeys = {
  all: ["vehicles"] as const,
  list: (page: number, limit: number, search: string) =>
    [...vehicleKeys.all, "list", page, limit, search] as const,
};

export function useVehiclesListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: vehicleKeys.list(page, limit, search),
    queryFn: () => listVehicles({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}
