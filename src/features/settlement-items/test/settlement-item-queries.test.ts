import { describe, expect, it } from "vitest";
import { MAX_SETTLEMENT_RANGE_DAYS, parseSettlementSearchParams, settlementRangeError } from "../settlement-item-queries";

// 17:30 UTC on 13/10 is already 14/10 in Vietnam.
const now = new Date("2026-10-13T17:30:00Z");
const subId = "11111111-1111-4111-8111-111111111111";

describe("parseSettlementSearchParams", () => {
  it("defaults to the last 7 Vietnam days, page 1", () => {
    expect(parseSettlementSearchParams({}, now)).toEqual({ page: 1, pageSize: 20, paidFrom: "2026-10-08", paidTo: "2026-10-14" });
  });

  it("keeps a valid Sub, range and page from the URL", () => {
    expect(parseSettlementSearchParams({ subMerchantId: subId, paidFrom: "2026-09-01", paidTo: "2026-09-30", page: "3", pageSize: "50" }, now))
      .toEqual({ subMerchantId: subId, paidFrom: "2026-09-01", paidTo: "2026-09-30", page: 3, pageSize: 50 });
  });

  it("falls back to the default range when the end is before the start or a date is malformed", () => {
    expect(parseSettlementSearchParams({ paidFrom: "2026-10-10", paidTo: "2026-10-01" }, now))
      .toMatchObject({ paidFrom: "2026-10-08", paidTo: "2026-10-14" });
    expect(parseSettlementSearchParams({ paidFrom: "10/10/2026", paidTo: "2026-10-12" }, now))
      .toMatchObject({ paidFrom: "2026-10-08", paidTo: "2026-10-14" });
  });

  it("drops a Sub id that is not a UUID", () => {
    expect(parseSettlementSearchParams({ subMerchantId: "abc" }, now)).not.toHaveProperty("subMerchantId");
  });

  it("keeps a valid Terminal and tranche group and drops unknown ones", () => {
    const terminalId = "22222222-2222-4222-8222-222222222222";
    expect(parseSettlementSearchParams({ terminalId, trancheStatus: "HELD" }, now)).toMatchObject({ terminalId, trancheStatus: "HELD" });
    const parsed = parseSettlementSearchParams({ terminalId: "x", trancheStatus: "PAID" }, now);
    expect(parsed).not.toHaveProperty("terminalId");
    expect(parsed).not.toHaveProperty("trancheStatus");
  });
});

describe("settlementRangeError", () => {
  it("accepts up to 92 days counting both ends, like the BE", () => {
    expect(MAX_SETTLEMENT_RANGE_DAYS).toBe(92);
    // 01/08 -> 31/10 is 92 days inclusive.
    expect(settlementRangeError("2026-08-01", "2026-10-31")).toBeNull();
    expect(settlementRangeError("2026-10-14", "2026-10-14")).toBeNull();
  });

  it("refuses a 93rd day before any call is made", () => {
    expect(settlementRangeError("2026-08-01", "2026-11-01")).toBe("Khoảng ngày tối đa 92 ngày");
  });

  it("does not judge an incomplete or reversed range (handled elsewhere)", () => {
    expect(settlementRangeError("", "2026-11-01")).toBeNull();
    expect(settlementRangeError("2026-11-01", "2026-10-01")).toBeNull();
  });
});

describe("parseSettlementSearchParams range cap", () => {
  it("falls back to the default 7 days when the URL asks for more than 92 days, so the BE is never called with it", () => {
    expect(parseSettlementSearchParams({ paidFrom: "2026-01-01", paidTo: "2026-10-14" }, now))
      .toMatchObject({ paidFrom: "2026-10-08", paidTo: "2026-10-14" });
  });
});
