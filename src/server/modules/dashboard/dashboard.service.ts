"server-only";

import {
  findRecentTransactions,
  findChartData,
  type FindDashboardParams,
} from "./dashboard.repository";
import type { ChartPeriod } from "@/features/dashboard/types/Dashboard.type";

const VALID_PERIODS: ChartPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export async function getDashboardTransactions(params: FindDashboardParams) {
  return findRecentTransactions(params);
}

export async function getRevenueChart(period: string) {
  if (!VALID_PERIODS.includes(period as ChartPeriod)) {
    return null;
  }
  return findChartData(period);
}
