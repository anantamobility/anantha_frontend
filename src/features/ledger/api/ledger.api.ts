import { apiClient, unwrapData } from "@/features/shared/api/apiClient";
import type { PaginatedListParams, PaginationMeta } from "@/features/shared/api/types";
import type { LedgerEntry } from "@/features/shared/entities";

export type LedgerSummary = {
  rider: {
    id: string;
    riderCode?: string | null;
    fullName: string;
    rentalType?: string;
  };
  totalCredits: string | number;
  totalDebits: string | number;
  payouts: string | number;
  availableBalance: string | number;
  unsettledEntryCount: number;
};

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

export async function getRiderLedgerSummary(riderId: string) {
  const response = await apiClient.get("/ledger-entries/summary", {
    params: { riderId },
  });
  return unwrapData<LedgerSummary>(response.data);
}
