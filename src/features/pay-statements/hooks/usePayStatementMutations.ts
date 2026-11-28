import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  generatePayStatement,
  payPayStatement,
  type GeneratePayStatementPayload,
  type PayStatementPaymentPayload,
} from "../api/payStatements.api";
import { payStatementKeys } from "./usePayStatementsQuery";

export function usePayStatementMutations() {
  const queryClient = useQueryClient();

  const invalidate = async (id?: string) => {
    await queryClient.invalidateQueries({ queryKey: payStatementKeys.all });
    if (id) {
      await queryClient.invalidateQueries({
        queryKey: payStatementKeys.detail(id),
      });
    }
  };

  return {
    generateMutation: useMutation({
      mutationFn: (payload: GeneratePayStatementPayload) =>
        generatePayStatement(payload),
      onSuccess: async (result) => {
        await invalidate(result.payStatement.id);
        notifySuccess(
          result.duplicate ? "Existing statement returned" : "Statement generated",
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to generate statement")),
    }),
    payMutation: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: PayStatementPaymentPayload;
      }) => payPayStatement(id, payload),
      onSuccess: async (result, variables) => {
        await invalidate(variables.id);
        notifySuccess(
          result.duplicate ? "Payment already recorded" : "Statement paid",
        );
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to pay statement")),
    }),
  };
}
