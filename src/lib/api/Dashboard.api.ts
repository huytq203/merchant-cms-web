import { apiClient } from "@/lib/http/api-client";
import {
  ChartParams,
  DashboardResponse,
  ParamsGetAll,
  RevenueChartResponse,
} from "../../features/dashboard/types/Dashboard.type";
const BASE = "/v1/admin/dashboard";

export const dashboardApi = {
  getAll: (params: ParamsGetAll) =>
    apiClient.get<DashboardResponse>(BASE, { query: params }),

  getRevenueChart: (params: ChartParams) =>
    apiClient.get<RevenueChartResponse>(`${BASE}/revenue-chart`, {
      query: params,
    }),
};
