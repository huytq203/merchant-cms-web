import { describe, expect, it } from "vitest";
import { holdCalendarSchema, holdRangeSchema } from "../schemas";
import { calendarFixture } from "./fixtures";

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
});
