import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/shared/context/authContext";
import { fetchDashboard } from "../api/dashboard.api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: (start: string, end: string) =>
    [...dashboardKeys.all, "summary", start, end] as const,
};

export function useDashboardQuery(startDate: string, endDate: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: dashboardKeys.summary(startDate, endDate),
    queryFn: () => fetchDashboard({ startDate, endDate }),
    enabled: !!accessToken && !!startDate && !!endDate,
  });
}
