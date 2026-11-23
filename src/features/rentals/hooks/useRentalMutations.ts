import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  closeRental,
  createRental,
  generateRentalDues,
  receiveRentalDeposit,
  refundRentalDeposit,
  type CloseRentalPayload,
  type CreateRentalPayload,
  type ReceiveDepositPayload,
  type RefundDepositPayload,
} from "../api/rentals.api";
import { rentalKeys } from "./useRentalsQuery";

async function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  rentalId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: rentalKeys.all });
  if (rentalId) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(rentalId) }),
      queryClient.invalidateQueries({ queryKey: rentalKeys.dues(rentalId) }),
      queryClient.invalidateQueries({
        queryKey: rentalKeys.collections(rentalId),
      }),
      queryClient.invalidateQueries({ queryKey: rentalKeys.deposit(rentalId) }),
    ]);
  }
}

export function useRentalMutations() {
  const queryClient = useQueryClient();

  return {
    createMutation: useMutation({
      mutationFn: (payload: CreateRentalPayload) => createRental(payload),
      onSuccess: async () => {
        await invalidateAll(queryClient);
        notifySuccess("Rental created");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to create rental")),
    }),
    closeMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload?: CloseRentalPayload;
      }) => closeRental(id, payload ?? {}),
      onSuccess: async (_data, variables) => {
        await invalidateAll(queryClient, variables.id);
        notifySuccess("Rental closed");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to close rental")),
    }),
    generateDuesMutation: useMutation({
      mutationFn: ({
        id,
        throughDate,
      }: {
        id: string;
        throughDate?: string;
      }) => generateRentalDues(id, throughDate ? { throughDate } : {}),
      onSuccess: async (result, variables) => {
        await invalidateAll(queryClient, variables.id);
        notifySuccess(
          typeof result.generated === "number"
            ? `Generated ${result.generated} due(s)`
            : "Dues generated",
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to generate dues")),
    }),
    receiveDepositMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ReceiveDepositPayload;
      }) => receiveRentalDeposit(id, payload),
      onSuccess: async (_data, variables) => {
        await invalidateAll(queryClient, variables.id);
        notifySuccess("Deposit received");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to receive deposit")),
    }),
    refundDepositMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: RefundDepositPayload;
      }) => refundRentalDeposit(id, payload),
      onSuccess: async (_data, variables) => {
        await invalidateAll(queryClient, variables.id);
        notifySuccess("Deposit refunded");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to refund deposit")),
    }),
  };
}
