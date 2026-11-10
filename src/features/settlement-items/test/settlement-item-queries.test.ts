import { describe, expect, it } from "vitest";
import { parseSettlementSearchParams } from "../settlement-item-queries";

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
