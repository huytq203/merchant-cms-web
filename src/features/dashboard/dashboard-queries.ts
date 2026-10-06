import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { retryUnlessUnsupported } from "@/features/sample-data/utils/unsupported";
import type { ChartPeriod, DashboardOverview, RevenueChartResponse } from "./types/Dashboard.type";

const BASE_PATH = "/v1/admin/dashboard";

export const dashboardQueries = {
  overview: () =>
    queryOptions({
      queryKey: ["dashboard", "overview"] as const,
      queryFn: () => apiClient.get<DashboardOverview>(BASE_PATH),
      retry: retryUnlessUnsupported,
    }),
  revenueChart: (period: ChartPeriod) =>
    queryOptions({
      queryKey: ["dashboard", "revenue-chart", period] as const,
      queryFn: () => apiClient.get<RevenueChartResponse>(`${BASE_PATH}/revenue-chart`, { query: { period } }),
      retry: retryUnlessUnsupported,
    }),
};
