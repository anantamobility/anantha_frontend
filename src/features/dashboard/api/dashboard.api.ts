import { apiClient, unwrapData } from "@/features/shared/api/apiClient";

export type DashboardSummary = {
  live?: {
    vehicles?: { total?: number; byStatus?: Record<string, number> };
    riders?: { total?: number; byStatus?: Record<string, number> };
  };
  collectionDue?: {
    totalCollections?: number;
    totalCollectedAmount?: string | number;
    totalPendingAmount?: string | number;
    totalOverdueAmount?: string | number;
    collectionsDue?: number;
    overdueCollections?: number;
  };
  deposits?: {
    openCount?: number;
    outstandingAmount?: string | number;
  };
};

export async function fetchDashboard(params: {
  startDate: string;
  endDate: string;
}) {
  const response = await apiClient.get("/dashboard", { params });
  return unwrapData<{ dashboard: DashboardSummary }>(response.data).dashboard;
}
