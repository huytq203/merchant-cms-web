import { describe, expect, it } from "vitest";
import type { DashboardSummary } from "../../types/Dashboard.type";
import { toStatCardValues } from "../dashboard-stats";

const summary: DashboardSummary = {
  balance: 1_250_000,
  balanceChangePercent: 12,
  revenueToday: 45_800,
  revenueChangePercent: 5,
  successfulTransactionsToday: 1204,
  successfulTransactionsChangePercent: -2,
  conversionRatePercent: 94.2,
  conversionChangePercent: 0.5,
  masterMerchantCount: 1,
  subMerchantCount: 6,
  terminalCount: 24,
};

describe("toStatCardValues", () => {
  it("builds the four headline cards in order", () => {
    const cards = toStatCardValues(summary);
    expect(cards.map((card) => card.key)).toEqual(["balance", "revenue", "successful", "conversion"]);
  });

  it("formats amounts and rates the Vietnamese way", () => {
    const [balance, , successful, conversion] = toStatCardValues(summary);
    expect(balance?.value).toBe("1.250.000 đ");
    expect(successful?.value).toBe("1.204");
    expect(conversion?.value).toBe("94,2%");
  });

  it("derives the trend direction and magnitude from the sign of the change", () => {
    const cards = toStatCardValues(summary);
    expect(cards[0]?.trend).toMatchObject({ value: "12%", direction: "up" });
    expect(cards[2]?.trend).toMatchObject({ value: "2%", direction: "down" });
    expect(cards[3]?.trend).toMatchObject({ value: "0,5%", direction: "up" });
  });
});
