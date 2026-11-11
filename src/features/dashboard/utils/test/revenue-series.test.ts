import { describe, expect, it } from "vitest";
import type { RevenuePoint } from "../../schemas/revenue.schema";
import { buildRevenueChart, compactAmount, periodLabel, revenueRange, revenueWindowText, totalsBySub } from "../revenue-series";

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
  it("covers the last 7, 15 or 30 days ending today by day", () => {
    const week = revenueRange("DAY_7", "2026-11-10");
    expect(week).toMatchObject({ from: "2026-11-04", to: "2026-11-10", granularity: "DAY" });
    expect(week.periods).toHaveLength(7);
    expect(revenueRange("DAY_15", "2026-11-10").from).toBe("2026-10-27");
    const month = revenueRange("DAY_30", "2026-11-03");
    expect(month.from).toBe("2026-10-05");
    expect(month.periods).toHaveLength(30);
    expect(month.periods.at(-1)).toBe("2026-11-03");
  });

  it("covers this month by day, from the 1st to today", () => {
    const range = revenueRange("THIS_MONTH", "2026-11-10");
    expect(range).toMatchObject({ from: "2026-11-01", to: "2026-11-10", granularity: "DAY" });
    expect(range.periods).toHaveLength(10);
  });

  it("covers the whole previous month, across a year boundary and in a leap February", () => {
    const range = revenueRange("LAST_MONTH", "2026-11-10");
    expect(range).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
    expect(range.periods).toHaveLength(31);
    expect(revenueRange("LAST_MONTH", "2027-01-05")).toMatchObject({ from: "2026-12-01", to: "2026-12-31" });
    expect(revenueRange("LAST_MONTH", "2028-03-02")).toMatchObject({ from: "2028-02-01", to: "2028-02-29" });
  });
});

describe("revenueWindowText", () => {
  it("names the period being viewed", () => {
    expect(revenueWindowText("DAY_7")).toBe("7 ngày gần nhất");
    expect(revenueWindowText("THIS_MONTH", { from: "2026-11-01", to: "2026-11-10" })).toBe("Tháng 11/2026 (từ 01/11 đến 10/11)");
    expect(revenueWindowText("LAST_MONTH", { from: "2026-10-01", to: "2026-10-31" })).toBe("Tháng 10/2026");
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
      { label: "01/11", period: "2026-11-01", total: 0, [chart.series[0]!.key]: 0, [chart.series[1]!.key]: 0 },
      { label: "02/11", period: "2026-11-02", total: 2_200_000, [chart.series[0]!.key]: 1_500_000, [chart.series[1]!.key]: 700_000 },
    ]);
  });

  it("stacks every Sub of a day into one column whose total is the sum, for the chosen metric", () => {
    const points = [
      point({ period: "2026-11-11", transactionCount: 3, grossAmount: 450_000, netAmount: 441_000 }),
      point({ subMerchantId: KIOSK, subMerchantCode: "MC000001-S002", subMerchantName: "nhinty12", period: "2026-11-11", transactionCount: 1, grossAmount: 2_000_000, netAmount: 1_960_000 }),
    ];
    const net = buildRevenueChart(points, ["2026-11-11"], "DAY", "NET");
    expect(net.rows[0]!.total).toBe(2_401_000);
    const count = buildRevenueChart(points, ["2026-11-11"], "DAY", "COUNT");
    expect(count.rows[0]!.total).toBe(4);
    expect(count.rows[0]![count.series[0]!.key]).toBe(3);
  });

  it("keeps each Sub on the same colour by ordering series by Sub code, not by arrival", () => {
    const later = point({ subMerchantId: KIOSK, subMerchantCode: "MC000001-S002", subMerchantName: "nhinty12" });
    const chart = buildRevenueChart([later, point({})], ["2026-11-02"], "DAY");
    expect(chart.series.map((series) => series.name)).toEqual(["Halo Láng", "nhinty12"]);
    expect(chart.series[0]!.color).toBe("var(--chart-1)");
  });
});

describe("compactAmount", () => {
  it("shortens axis amounts to k / tr / tỷ in Vietnamese notation", () => {
    expect(compactAmount(0)).toBe("0");
    expect(compactAmount(950)).toBe("950");
    expect(compactAmount(90_000)).toBe("90k");
    expect(compactAmount(1_500_000)).toBe("1,5tr");
    expect(compactAmount(2_000_000)).toBe("2tr");
    expect(compactAmount(1_250_000_000)).toBe("1,3 tỷ");
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
