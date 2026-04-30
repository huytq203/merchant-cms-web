import { useQuery } from "@tanstack/react-query";
import type { ChartParams } from "../types/Dashboard.type";
import { dashboardApi } from "../../../lib/api/Dashboard.api";

export const useRevenueChartQuery = (params: ChartParams) => {
  return useQuery({
    queryKey: ["dashboard", "revenue-chart", params],
    queryFn: () => dashboardApi.getRevenueChart(params),
    staleTime: 1000 * 60 * 5,
  });
};
