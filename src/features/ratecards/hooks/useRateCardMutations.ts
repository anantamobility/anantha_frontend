import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { rateCardEntityKeys } from "@/features/shared/entities";
import {
  assignRateCardToClient,
  createRateCard,
  deleteRateCard,
  updateRateCard,
  type AssignRateCardPayload,
  type RateCardPayload,
} from "../api/ratecards.api";
import { rateCardKeys } from "./useRateCardsQuery";

async function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: rateCardKeys.all }),
    queryClient.invalidateQueries({ queryKey: rateCardEntityKeys.all }),
  ]);
}

export function useRateCardMutations() {
  const queryClient = useQueryClient();
  return {
    createMutation: useMutation({
      mutationFn: (payload: RateCardPayload) => createRateCard(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rate card created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create rate card")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<RateCardPayload> }) =>
        updateRateCard(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rate card updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update rate card")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteRateCard(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rate card deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete rate card")),
    }),
    assignMutation: useMutation({
      mutationFn: (payload: AssignRateCardPayload) => assignRateCardToClient(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rate card assigned to client");
      },
      onError: (e) =>
        notifyError(getErrorMessage(e, "Failed to assign rate card")),
    }),
  };
}
