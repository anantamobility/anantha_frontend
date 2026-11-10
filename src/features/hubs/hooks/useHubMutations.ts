import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { hubEntityKeys } from "@/features/shared/entities";
import { createHub, deleteHub, updateHub, type HubPayload } from "../api/hubs.api";
import { hubKeys } from "./useHubsQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: hubKeys.all }),
    queryClient.invalidateQueries({ queryKey: hubEntityKeys.all }),
  ]);
}

export function useHubMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (payload: HubPayload) => createHub(payload),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Hub created");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to create hub")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HubPayload> }) =>
      updateHub(id, payload),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Hub updated");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to update hub")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteHub(id),
    onSuccess: async () => {
      await invalidate(queryClient);
      notifySuccess("Hub deleted");
    },
    onError: (error) => notifyError(getErrorMessage(error, "Failed to delete hub")),
  });

  return { createMutation, updateMutation, deleteMutation };
}
