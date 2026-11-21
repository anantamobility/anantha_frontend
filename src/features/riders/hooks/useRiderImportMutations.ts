import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { riderEntityKeys } from "@/features/shared/entities";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { importRiders, validateRiderImport } from "../api/riders.api";
import type { RiderImportRow } from "../api/riderImport.types";
import { riderKeys } from "./useRidersQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: riderKeys.all }),
    queryClient.invalidateQueries({ queryKey: riderEntityKeys.all }),
  ]);
}

export function useRiderImportMutations() {
  const queryClient = useQueryClient();

  return {
    validateMutation: useMutation({
      mutationFn: (rows: RiderImportRow[]) => validateRiderImport(rows),
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to validate import file")),
    }),
    importMutation: useMutation({
      mutationFn: (rows: RiderImportRow[]) => importRiders(rows),
      onSuccess: async (result) => {
        if (result.summary.created > 0) {
          await invalidate(queryClient);
        }
        notifySuccess(
          `Import finished: ${result.summary.created} created, ${result.summary.failed} failed`,
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to import riders")),
    }),
  };
}
