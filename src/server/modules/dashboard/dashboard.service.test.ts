import { afterEach, describe, expect, it, vi } from "vitest";
import { getDashboardOverview, getRevenueChart } from "./dashboard.service";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("dashboard service in fixture mode", () => {
  it("returns the overview and the chart of the requested period", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "development");
    const overview = await getDashboardOverview();
    expect(overview.success).toBe(true);
    const sevenDays = await getRevenueChart("7days");
    const thirtyDays = await getRevenueChart("30days");
    if (!sevenDays.success || !thirtyDays.success) throw new Error("expected success");
    expect(sevenDays.data.points).toHaveLength(7);
    expect(thirtyDays.data.points).toHaveLength(30);
  });
});

describe("dashboard service without a BE API", () => {
  it("answers NOT_IMPLEMENTED 501 in live mode", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "live");
    vi.stubEnv("NODE_ENV", "development");
    for (const result of [await getDashboardOverview(), await getRevenueChart("thisMonth")]) {
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(501);
        expect(result.error.code).toBe("NOT_IMPLEMENTED");
      }
    }
  });

  it("never serves fixtures in production, even when the environment says fixture", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "production");
    expect((await getDashboardOverview()).success).toBe(false);
    expect((await getRevenueChart("thisMonth")).success).toBe(false);
  });
});
