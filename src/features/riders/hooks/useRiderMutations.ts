import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { riderEntityKeys } from "@/features/shared/entities";
import { createRider, deleteRider, updateRider, type RiderPayload } from "../api/riders.api";
import { riderKeys } from "./useRidersQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: riderKeys.all }),
    queryClient.invalidateQueries({ queryKey: riderEntityKeys.all }),
  ]);
}

export function useRiderMutations() {
  const queryClient = useQueryClient();
  return {
    createMutation: useMutation({
      mutationFn: (payload: RiderPayload) => createRider(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create rider")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<RiderPayload> }) =>
        updateRider(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update rider")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteRider(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete rider")),
    }),
  };
}
