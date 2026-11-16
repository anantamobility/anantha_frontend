import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import { riderEntityKeys } from "@/features/shared/entities";
import {
  createRider,
  deleteRider,
  deleteRiderDocument,
  updateRider,
  updateRiderStatus,
  uploadRiderDocument,
  type RiderCreatePayload,
  type RiderStatusPayload,
  type RiderUpdatePayload,
} from "../api/riders.api";
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
      mutationFn: (payload: RiderCreatePayload) => createRider(payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider created");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to create rider")),
    }),
    updateMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: RiderUpdatePayload }) =>
        updateRider(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update rider")),
    }),
    statusMutation: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: RiderStatusPayload }) =>
        updateRiderStatus(id, payload),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider status updated");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to update rider status")),
    }),
    deleteMutation: useMutation({
      mutationFn: (id: string) => deleteRider(id),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Rider deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete rider")),
    }),
    uploadDocumentMutation: useMutation({
      mutationFn: ({
        riderId,
        file,
        meta,
      }: {
        riderId: string;
        file: File;
        meta: {
          documentType: string;
          title: string;
          issueDate?: string | null;
          expiryDate?: string | null;
          notes?: string;
        };
      }) => uploadRiderDocument(riderId, file, meta),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Document uploaded");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to upload document")),
    }),
    deleteDocumentMutation: useMutation({
      mutationFn: ({
        riderId,
        documentId,
      }: {
        riderId: string;
        documentId: string;
      }) => deleteRiderDocument(riderId, documentId),
      onSuccess: async () => {
        await invalidate(queryClient);
        notifySuccess("Document deleted");
      },
      onError: (e) => notifyError(getErrorMessage(e, "Failed to delete document")),
    }),
  };
}
