import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { vehicleEntityKeys } from "@/features/shared/entities";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  importVehicles,
  validateVehicleImport,
} from "../api/vehicles.api";
import type { VehicleImportRow } from "../api/vehicleImport.types";
import { vehicleKeys } from "./useVehiclesQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
    queryClient.invalidateQueries({ queryKey: vehicleEntityKeys.all }),
  ]);
}

export function useVehicleImportMutations() {
  const queryClient = useQueryClient();

  return {
    validateMutation: useMutation({
      mutationFn: (rows: VehicleImportRow[]) => validateVehicleImport(rows),
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to validate import file")),
    }),
    importMutation: useMutation({
      mutationFn: (rows: VehicleImportRow[]) => importVehicles(rows),
      onSuccess: async (result) => {
        if (result.summary.created > 0) {
          await invalidate(queryClient);
        }
        notifySuccess(
          `Import finished: ${result.summary.created} created, ${result.summary.failed} failed`,
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to import vehicles")),
    }),
  };
}
