import "server-only";

import type { BeResult } from "@/lib/be/client";
import { resolveModuleSource, unsupportedResult } from "@/lib/be/api-mode";
import { ok } from "@/lib/http/result";
import type { ChartPeriod, DashboardOverview, RevenueChartResponse } from "@/features/dashboard/types/Dashboard.type";
import { DASHBOARD_OVERVIEW_FIXTURE, REVENUE_CHART_FIXTURES } from "./dashboard.fixtures";

/**
 * The BE has no dashboard API yet: serves fixtures in development, otherwise NOT_IMPLEMENTED.
 * The BE will scope the numbers by the access token, so no merchant id is passed.
 */
export async function getDashboardOverview(): Promise<BeResult<DashboardOverview>> {
  if (resolveModuleSource("dashboard") !== "fixture") return unsupportedResult();
  return ok(DASHBOARD_OVERVIEW_FIXTURE);
}

export async function getRevenueChart(period: ChartPeriod): Promise<BeResult<RevenueChartResponse>> {
  if (resolveModuleSource("dashboard") !== "fixture") return unsupportedResult();
  return ok(REVENUE_CHART_FIXTURES[period]);
}
