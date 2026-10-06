import type { z } from "zod";
import type {
  chartPeriodSchema,
  dashboardOverviewSchema,
  dashboardSummarySchema,
  recentTransactionSchema,
  revenueChartSchema,
  revenueDataPointSchema,
  revenueSummarySchema,
} from "../schemas/dashboard.schema";

export type ChartPeriod = z.infer<typeof chartPeriodSchema>;
export type RevenueDataPoint = z.infer<typeof revenueDataPointSchema>;
export type RevenueSummary = z.infer<typeof revenueSummarySchema>;
export type RevenueChartResponse = z.infer<typeof revenueChartSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type RecentTransaction = z.infer<typeof recentTransactionSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
