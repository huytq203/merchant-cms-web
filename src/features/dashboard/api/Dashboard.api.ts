import { apiClient } from "@/lib/http/api-client";
import { DashboardResponse, ParamsGetAll } from "../types/Dashboard.type";
const BASE = '/v1/admin/dashboard';

export const dashboardApi = {
   getAll: (params:ParamsGetAll)=>apiClient.get<DashboardResponse>(BASE, { query: params }),
}