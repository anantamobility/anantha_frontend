import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { vehicleEntityKeys } from "@/features/shared/entities";
import {
  createVehicle,
  deleteVehicle,
  updateVehicle,
  type VehiclePayload,
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

  const createMutation = useMutation({
    mutationFn: (payload: VehiclePayload) => createVehicle(payload),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Vehicle created");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to create vehicle")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<VehiclePayload> }) =>
      updateVehicle(id, payload),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Vehicle updated");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to update vehicle")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Vehicle deleted");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to delete vehicle")),
  });

  return { createMutation, updateMutation, deleteMutation };
}
