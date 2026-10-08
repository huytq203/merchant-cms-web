import { describe, expect, it } from "vitest";
import { dashboardQueries } from "../dashboard-queries";

describe("dashboardQueries", () => {
  it("keys the chart by period so each period is cached on its own", () => {
    const sevenDays = dashboardQueries.revenueChart("7days");
    const thisMonth = dashboardQueries.revenueChart("thisMonth");
    expect(sevenDays.queryKey).not.toEqual(thisMonth.queryKey);
  });

  it("keeps the overview and the chart under separate keys", () => {
    expect(dashboardQueries.overview().queryKey).not.toEqual(dashboardQueries.revenueChart("thisMonth").queryKey);
  });
});
