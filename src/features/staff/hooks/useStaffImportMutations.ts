import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { importStaff, validateStaffImport } from "../api/staff.api";
import type { StaffImportRow } from "../api/staffImport.types";
import { staffKeys } from "./useStaffQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: staffKeys.all });
}

export function useStaffImportMutations() {
  const queryClient = useQueryClient();

  return {
    validateMutation: useMutation({
      mutationFn: (rows: StaffImportRow[]) => validateStaffImport(rows),
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to validate import file")),
    }),
    importMutation: useMutation({
      mutationFn: (rows: StaffImportRow[]) => importStaff(rows),
      onSuccess: async (result) => {
        if (result.summary.created > 0) {
          await invalidate(queryClient);
        }
        notifySuccess(
          `Import finished: ${result.summary.created} created, ${result.summary.failed} failed`,
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to import staff")),
    }),
  };
}
