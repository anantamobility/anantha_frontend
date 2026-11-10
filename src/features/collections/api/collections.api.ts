import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";

export type Collection = {
  id: string;
  rentalId: string;
  amount: string | number;
  currency: string;
  paymentMethod: string;
  referenceNumber?: string | null;
  receivedAt: string;
  status: string;
  notes?: string | null;
  rental?: { id: string; rentalNumber: string };
  rider?: { id: string; fullName: string } | null;
  client?: { id: string; name: string } | null;
};

export type CreateCollectionPayload = {
  rentalId: string;
  amount: string;
  paymentMethod:
    | "CASH"
    | "UPI"
    | "CARD"
    | "BANK_TRANSFER"
    | "CHEQUE"
    | "OTHER";
  referenceNumber?: string | null;
  status?: "PENDING" | "CLEARED";
  notes?: string | null;
};

export async function listCollections(
  params: PaginatedListParams & { status?: string; rentalId?: string },
) {
  const response = await apiClient.get("/collections", { params });
  return unwrapData<{ collections: Collection[]; pagination: PaginationMeta }>(
    response.data,
  );
}

export async function createCollection(payload: CreateCollectionPayload) {
  const response = await apiClient.post("/collections", payload);
  return unwrapData<{ collection: Collection }>(response.data).collection;
}

/** Collectible rentals for collection form dropdown (owned by collections feature). */
export async function listActiveRentalsForCollection() {
  const [active, onHold] = await Promise.all([
    apiClient.get("/rentals", {
      params: { page: 1, limit: 100, status: "ACTIVE" },
    }),
    apiClient.get("/rentals", {
      params: { page: 1, limit: 100, status: "ON_HOLD" },
    }),
  ]);
  const activeRows = unwrapData<{
    rentals: Array<{
      id: string;
      rentalNumber: string;
      client?: { name?: string };
    }>;
  }>(active.data).rentals;
  const onHoldRows = unwrapData<{
    rentals: Array<{
      id: string;
      rentalNumber: string;
      client?: { name?: string };
    }>;
  }>(onHold.data).rentals;
  return [...activeRows, ...onHoldRows];
}
