import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { rentalKeys } from "@/features/rentals/hooks/useRentalsQuery";
import {
  deployIn,
  deployOut,
  type DeployInPayload,
  type DeployOutPayload,
} from "../api/deployments.api";
import { deploymentKeys } from "./useDeploymentsQuery";

export function useDeploymentMutations() {
  const queryClient = useQueryClient();

  const invalidate = async (rentalId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: deploymentKeys.all }),
      queryClient.invalidateQueries({ queryKey: rentalKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["entities", "vehicles"] }),
      rentalId
        ? queryClient.invalidateQueries({
            queryKey: rentalKeys.detail(rentalId),
          })
        : Promise.resolve(),
    ]);
  };

  return {
    deployOutMutation: useMutation({
      mutationFn: (payload: DeployOutPayload) => deployOut(payload),
      onSuccess: async (_data, variables) => {
        await invalidate(variables.rentalId);
        notifySuccess("Vehicle deployed out");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to deploy out")),
    }),
    deployInMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: DeployInPayload;
        rentalId?: string;
      }) => deployIn(id, payload),
      onSuccess: async (_data, variables) => {
        await invalidate(variables.rentalId);
        notifySuccess("Vehicle deployed in");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to deploy in")),
    }),
  };
}
