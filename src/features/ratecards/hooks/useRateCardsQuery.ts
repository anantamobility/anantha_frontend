import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { listRateCards } from "../api/ratecards.api";

export const rateCardKeys = {
  all: ["ratecards"] as const,
  list: (page: number, limit: number, search: string) =>
    [...rateCardKeys.all, "list", page, limit, search] as const,
};

export function useRateCardsListQuery(page: number, limit: number, search: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rateCardKeys.list(page, limit, search),
    queryFn: () => listRateCards({ page, limit, search: search || undefined }),
    enabled: !!accessToken,
    placeholderData: (prev) => prev,
  });
}
