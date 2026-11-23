import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import {
  getRiderLedgerSummary,
  listLedgerEntries,
} from "../api/ledger.api";

export const ledgerKeys = {
  all: ["ledger"] as const,
  list: (page: number, limit: number, search: string, riderId: string) =>
    [...ledgerKeys.all, "list", page, limit, search, riderId] as const,
  summary: (riderId: string) =>
    [...ledgerKeys.all, "summary", riderId] as const,
};

export function useLedgerListQuery(
  page: number,
  limit: number,
  search: string,
  riderId: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ledgerKeys.list(page, limit, search, riderId),
    queryFn: () =>
      listLedgerEntries({
        page,
        limit,
        search: search || undefined,
        riderId: riderId || undefined,
      }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}

export function useLedgerSummaryQuery(riderId: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ledgerKeys.summary(riderId),
    queryFn: () => getRiderLedgerSummary(riderId),
    enabled: !!accessToken && !!riderId,
  });
}
