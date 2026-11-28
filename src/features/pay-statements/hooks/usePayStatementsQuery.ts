import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { getPayStatement, listPayStatements } from "../api/payStatements.api";

export const payStatementKeys = {
  all: ["pay-statements"] as const,
  list: (page: number, search: string, riderId: string, status: string) =>
    [...payStatementKeys.all, "list", page, search, riderId, status] as const,
  detail: (id: string) => [...payStatementKeys.all, "detail", id] as const,
};

export function usePayStatementsListQuery(
  page: number,
  limit: number,
  search: string,
  riderId: string,
  status: string,
) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: payStatementKeys.list(page, search, riderId, status),
    queryFn: () =>
      listPayStatements({
        page,
        limit,
        search: search || undefined,
        riderId: riderId || undefined,
        status: status || undefined,
      }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}

export function usePayStatementDetailQuery(id: string | null) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: payStatementKeys.detail(id ?? ""),
    queryFn: () => getPayStatement(id!),
    enabled: !!accessToken && !!id,
  });
}
