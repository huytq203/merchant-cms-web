import { describe, expect, it } from "vitest";
import { holdCalendarSchema, holdItemPageSchema, holdItemSchema, holdRangeSchema } from "../schemas";
import { calendarFixture, holdItemFixture, releasedItemFixture } from "./fixtures";

describe("hold calendar schema", () => {
  it("parses the BE calendar", () => {
    expect(holdCalendarSchema.parse(calendarFixture).days).toHaveLength(4);
  });

  it("accepts a calendar without a peak day or a ledger reading", () => {
    const parsed = holdCalendarSchema.parse({ ...calendarFixture, peak: null, ledgerHeld: null, days: [] });
    expect(parsed.peak).toBeNull();
  });

  it("only knows the four ranges the BE accepts", () => {
    expect(holdRangeSchema.options).toEqual(["DAYS_7", "DAYS_30", "DAYS_90", "ALL"]);
  });

  it("reads the past released and cancelled totals, and a BE without them", () => {
    expect(holdCalendarSchema.parse(calendarFixture).releasedInPast).toEqual({ count: 1, amount: 10_000 });
    const old: Record<string, unknown> = { ...calendarFixture };
    for (const key of ["pastFrom", "releasedInPast", "cancelledByRefund"]) delete old[key];
    const parsed = holdCalendarSchema.parse(old);
    expect(parsed.releasedInPast).toBeNull();
    expect(parsed.cancelledByRefund).toBeNull();
  });

  it("parses a hold item and a page of them", () => {
    expect(holdItemSchema.parse(holdItemFixture).orderCode).toBe("HOLDTEST-1110161321");
    expect(holdItemSchema.parse(releasedItemFixture).releasedAt).toBe("2026-10-11T17:00:05Z");
    expect(holdItemSchema.safeParse({ ...holdItemFixture, state: "LOST" }).success).toBe(false);
    expect(holdItemPageSchema.parse({ rows: [holdItemFixture], total: 1 }).rows).toHaveLength(1);
  });

  it("accepts a hold item without dates and a calendar without the released days", () => {
    expect(holdItemSchema.safeParse({ ...holdItemFixture, holdReleaseAt: null, eventAt: null }).success).toBe(true);
    expect(holdCalendarSchema.parse(calendarFixture).releasedByDay).toEqual([]);
  });
});
