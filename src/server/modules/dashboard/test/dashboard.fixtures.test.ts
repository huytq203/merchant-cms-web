import { describe, expect, it } from "vitest";
import {
  chartPeriodSchema,
  dashboardOverviewSchema,
  revenueChartSchema,
} from "@/features/dashboard/schemas/dashboard.schema";
import { DASHBOARD_OVERVIEW_FIXTURE, REVENUE_CHART_FIXTURES } from "../dashboard.fixtures";

describe("dashboard fixtures", () => {
  it("the overview parses with the module schema", () => {
    expect(dashboardOverviewSchema.safeParse(DASHBOARD_OVERVIEW_FIXTURE).success).toBe(true);
    expect(DASHBOARD_OVERVIEW_FIXTURE.recentTransactions.length).toBeGreaterThan(0);
  });

  it("has a parsable chart for every period", () => {
    for (const period of chartPeriodSchema.options) {
      const chart = REVENUE_CHART_FIXTURES[period];
      expect(revenueChartSchema.safeParse(chart).success).toBe(true);
      expect(chart.points.length).toBeGreaterThan(1);
    }
  });

  it("only carries the allowed keys", () => {
    expect(Object.keys(DASHBOARD_OVERVIEW_FIXTURE).sort()).toEqual(["recentTransactions", "summary"]);
    const allowed = ["amount", "cardType", "code", "createdAt", "customerName", "id", "status"];
    for (const row of DASHBOARD_OVERVIEW_FIXTURE.recentTransactions) {
      expect(Object.keys(row).sort()).toEqual(allowed);
    }
  });

  it("contains no real personal data: placeholder customers, no emails or phone numbers", () => {
    for (const row of DASHBOARD_OVERVIEW_FIXTURE.recentTransactions) {
      expect(row.customerName).toMatch(/^Khách hàng mẫu \d+$/);
      expect(JSON.stringify(row)).not.toMatch(/@|\d{9,}/);
    }
  });

  it("keeps each chart summary consistent with its points", () => {
    for (const period of chartPeriodSchema.options) {
      const { points, summary } = REVENUE_CHART_FIXTURES[period];
      expect(summary.totalRevenue).toBe(points.reduce((sum, point) => sum + point.revenue, 0));
      expect(summary.totalTransactions).toBe(points.reduce((sum, point) => sum + point.transactions, 0));
    }
  });
});
