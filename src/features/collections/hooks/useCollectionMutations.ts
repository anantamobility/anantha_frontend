import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";
import {
  createCollection,
  type CreateCollectionPayload,
} from "../api/collections.api";
import { collectionKeys } from "./useCollectionsQuery";

export function useCollectionMutations() {
  const queryClient = useQueryClient();

  return {
    createMutation: useMutation({
      mutationFn: (payload: CreateCollectionPayload) => createCollection(payload),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
          queryClient.invalidateQueries({ queryKey: ["rentals"] }),
        ]);
        notifySuccess("Collection recorded");
      },
      onError: (error) =>
        notifyError(getErrorMessage(error, "Failed to record collection")),
    }),
  };
}
