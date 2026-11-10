import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  activateRental,
  assignVehicle,
  closeRental,
  createRental,
  generateRentalDues,
  type CreateRentalPayload,
} from "../api/rentals.api";
import { rentalKeys } from "./useRentalsQuery";

async function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  rentalId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: rentalKeys.all });
  if (rentalId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(rentalId) }),
      queryClient.invalidateQueries({ queryKey: rentalKeys.dues(rentalId) }),
    ]);
  }
}

export function useRentalMutations() {
  const queryClient = useQueryClient();

  return {
    createMutation: useMutation({
      mutationFn: (payload: CreateRentalPayload) => createRental(payload),
      onSuccess: async () => {
        await invalidateAll(queryClient);
        notifySuccess("Rental created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create rental")),
    }),
    assignVehicleMutation: useMutation({
      mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) =>
        assignVehicle(id, vehicleId),
      onSuccess: async (_data, vars) => {
        await invalidateAll(queryClient, vars.id);
        notifySuccess("Vehicle assigned");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to assign vehicle")),
    }),
    activateMutation: useMutation({
      mutationFn: (id: string) => activateRental(id),
      onSuccess: async (_data, id) => {
        await invalidateAll(queryClient, id);
        notifySuccess("Rental activated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to activate rental")),
    }),
    generateDuesMutation: useMutation({
      mutationFn: (id: string) => generateRentalDues(id),
      onSuccess: async (_data, id) => {
        await invalidateAll(queryClient, id);
        notifySuccess("Dues generated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to generate dues")),
    }),
    closeMutation: useMutation({
      mutationFn: (id: string) => closeRental(id),
      onSuccess: async (_data, id) => {
        await invalidateAll(queryClient, id);
        notifySuccess("Rental closed");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to close rental")),
    }),
  };
}
