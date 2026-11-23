import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { clientEntityKeys } from "@/features/shared/entities";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  createClient,
  deleteClient,
  generateClientDues,
  updateClient,
  updateClientStatus,
  type ClientPayload,
  type ClientStatusPayload,
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
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to create client")),
    }),
    updateMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Partial<ClientPayload>;
      }) => updateClient(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to update client")),
    }),
    statusMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ClientStatusPayload;
      }) => updateClientStatus(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client status updated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to update client status")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteClient(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client deleted");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to delete client")),
    }),
    generateDuesMutation: useMutation({
      mutationFn: ({
        id,
        throughDate,
      }: {
        id: string;
        throughDate?: string;
      }) => generateClientDues(id, throughDate ? { throughDate } : {}),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Client dues generated");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to generate client dues")),
    }),
  };
}
