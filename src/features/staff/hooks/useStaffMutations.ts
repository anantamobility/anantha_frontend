import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  createStaff,
  deleteStaff,
  updateStaff,
  type StaffCreatePayload,
  type StaffUpdatePayload,
} from "../api/staff.api";
import { staffKeys } from "./useStaffQuery";

export function useStaffMutations() {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: staffKeys.all });
  };

  return {
    createMutation: useMutation({
      mutationFn: (payload: StaffCreatePayload) => createStaff(payload),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Staff created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create staff")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: StaffUpdatePayload }) =>
        updateStaff(id, payload),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Staff updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update staff")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteStaff(id),
      onSuccess: async () => {
        await invalidate();
        notifySuccess("Staff deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete staff")),
    }),
  };
}
