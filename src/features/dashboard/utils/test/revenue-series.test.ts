import { describe, expect, it } from "vitest";
import type { RevenuePoint } from "../../schemas/revenue.schema";
import { buildRevenueChart, periodLabel, revenueRange, totalsBySub } from "../revenue-series";

const point = (overrides: Partial<RevenuePoint>): RevenuePoint => ({
  subMerchantId: "5dcda5e6-afd1-4201-a02f-7187164f0f86",
  subMerchantCode: "MC000001-S001",
  subMerchantName: "Halo Láng",
  period: "2026-11-02",
  transactionCount: 1,
  grossAmount: 1_500_000,
  feeAmount: 30_000,
  netAmount: 1_470_000,
  ...overrides,
});
const KIOSK = "1311ae27-4ecb-447d-8c78-f3eb1307684c";

describe("revenueRange", () => {
  it("covers the last 30 days ending today by day", () => {
    const range = revenueRange("DAY", "2026-11-03");
    expect(range.from).toBe("2026-10-05");
    expect(range.to).toBe("2026-11-03");
    expect(range.periods).toHaveLength(30);
    expect(range.periods.at(-1)).toBe("2026-11-03");
  });

  it("covers the last 12 months by month, from the first day of the first month", () => {
    const range = revenueRange("MONTH", "2026-11-03");
    expect(range.from).toBe("2025-12-01");
    expect(range.to).toBe("2026-11-03");
    expect(range.periods).toEqual([
      "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05",
      "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11",
    ]);
  });
});

describe("periodLabel", () => {
  it("reads as day/month or month/year", () => {
    expect(periodLabel("2026-11-02", "DAY")).toBe("02/11");
    expect(periodLabel("2026-11", "MONTH")).toBe("11/2026");
  });
});

describe("buildRevenueChart", () => {
  it("gives every period a row, zero where a Sub had no payment, and one stacked series per Sub", () => {
    const chart = buildRevenueChart(
      [point({}), point({ subMerchantId: KIOSK, subMerchantName: "Halo Cầu Giấy", grossAmount: 700_000 })],
      ["2026-11-01", "2026-11-02"],
      "DAY",
    );
    expect(chart.series.map((series) => series.name)).toEqual(["Halo Láng", "Halo Cầu Giấy"]);
    expect(chart.rows).toEqual([
      { label: "01/11", [chart.series[0]!.key]: 0, [chart.series[1]!.key]: 0 },
      { label: "02/11", [chart.series[0]!.key]: 1_500_000, [chart.series[1]!.key]: 700_000 },
    ]);
  });
});

describe("totalsBySub", () => {
  it("sums each Sub over the range, biggest gross first, with a grand total", () => {
    const { subs, total } = totalsBySub([
      point({ period: "2026-11-01", grossAmount: 100_000, feeAmount: 2_000, netAmount: 98_000 }),
      point({}),
      point({ subMerchantId: KIOSK, subMerchantName: "Halo Cầu Giấy", grossAmount: 700_000, feeAmount: 0, netAmount: 700_000 }),
    ]);
    expect(subs.map((sub) => [sub.subMerchantName, sub.transactionCount, sub.grossAmount, sub.feeAmount, sub.netAmount])).toEqual([
      ["Halo Láng", 2, 1_600_000, 32_000, 1_568_000],
      ["Halo Cầu Giấy", 1, 700_000, 0, 700_000],
    ]);
    expect(total).toEqual({ transactionCount: 3, grossAmount: 2_300_000, feeAmount: 32_000, netAmount: 2_268_000 });
  });
});
