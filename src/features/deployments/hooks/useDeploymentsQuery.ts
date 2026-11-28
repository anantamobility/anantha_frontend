import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listDeployments } from "../api/deployments.api";

export const deploymentKeys = {
  all: ["deployments"] as const,
  byRental: (rentalId: string) =>
    [...deploymentKeys.all, "rental", rentalId] as const,
};

export function useRentalDeploymentsQuery(rentalId: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: deploymentKeys.byRental(rentalId ?? ""),
    queryFn: () =>
      listDeployments({ page: 1, limit: 50, rentalId: rentalId! }),
    enabled: !!accessToken && !!rentalId,
  });
}
