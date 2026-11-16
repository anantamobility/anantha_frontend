import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { vehicleEntityKeys } from "@/features/shared/entities";
import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
  updateVehicleStatus,
  type VehiclePayload,
  type VehicleStatusPayload,
} from "../api/vehicles.api";
import { vehicleKeys } from "./useVehiclesQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
    queryClient.invalidateQueries({ queryKey: vehicleEntityKeys.all }),
  ]);
}

export function useVehicleMutations() {
  const queryClient = useQueryClient();

  return {
    createMutation: useMutation({
      mutationFn: (payload: VehiclePayload) => createVehicle(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Vehicle created");
      },
      onError: (error) => notifyError(getErrorMessage(error, "Failed to create vehicle")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<VehiclePayload> }) =>
        updateVehicle(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Vehicle updated");
      },
      onError: (error) => notifyError(getErrorMessage(error, "Failed to update vehicle")),
    }),
    statusMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: VehicleStatusPayload }) =>
        updateVehicleStatus(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Vehicle status updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to update vehicle status")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteVehicle(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Vehicle deleted");
      },
      onError: (error) => notifyError(getErrorMessage(error, "Failed to delete vehicle")),
    }),
  };
}
