import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { clientEntityKeys } from "@/features/shared/entities";
import {
  createClient,
  deleteClient,
  updateClient,
  type ClientPayload,
} from "../api/clients.api";
import { clientKeys } from "./useClientsQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: clientKeys.all }),
    queryClient.invalidateQueries({ queryKey: clientEntityKeys.all }),
  ]);
}

export function useClientMutations() {
  const queryClient = useQueryClient();
  return {
    createMutation: useMutation({
      mutationFn: (payload: ClientPayload) => createClient(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create client")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<ClientPayload> }) =>
        updateClient(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update client")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteClient(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete client")),
    }),
  };
}
