import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { Collection } from "@/features/shared/entities";

export type CreateCollectionPayload = {
  rentalDueId: string;
  amount: string;
  paymentMethod:
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER";
  referenceNumber?: string | null;
  receivedAt?: string;
  notes?: string | null;
};

export async function listCollections(params: PaginatedListParams) {
  const response = await apiClient.get("/collections", { params });
  return unwrapData<{ collections: Collection[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function getCollection(id: string) {
  const response = await apiClient.get(`/collections/${id}`);
  return unwrapData<{ collection: Collection }>(response.data).collection;
}

export async function createCollection(payload: CreateCollectionPayload) {
  const response = await apiClient.post("/collections", payload);
  return unwrapData<{ collection: Collection }>(response.data).collection;
}
