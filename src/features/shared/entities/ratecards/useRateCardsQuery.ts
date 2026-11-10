import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchRateCards } from "./ratecards.api";

export const rateCardEntityKeys = {
  all: ["entities", "ratecards"] as const,
  list: (search?: string) => [...rateCardEntityKeys.all, "list", search ?? ""] as const,
};

export function useRateCardsQuery(search?: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: rateCardEntityKeys.list(search),
    queryFn: () => fetchRateCards({ page: 1, limit: 100, search: search || undefined }),
    enabled: !!accessToken,
    staleTime: 60_000,
  });
}
