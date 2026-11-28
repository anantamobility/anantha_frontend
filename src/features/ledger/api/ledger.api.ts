import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { LedgerEntry } from "@/features/shared/entities";

export async function listLedgerEntries(
  params: PaginatedListParams & {
    riderId?: string;
    rentalId?: string;
    entryType?: string;
    direction?: string;
  } = {},
) {
  const response = await apiClient.get("/ledger-entries", { params });
  return unwrapData<{ entries: LedgerEntry[]; pagination: PaginationMeta }>(
    response.data,
  );
}
