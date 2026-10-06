import { describe, expect, it } from "vitest";
import { formatIsoDate, parseIsoDate } from "./date-value";

describe("date value helpers", () => {
  it("round-trips a calendar date without shifting the day", () => {
    const parsed = parseIsoDate("2099-03-09");
    expect(parsed).toBeInstanceOf(Date);
    expect(formatIsoDate(parsed)).toBe("2099-03-09");
  });

  it("returns empty values for blank or invalid input", () => {
    expect(parseIsoDate("")).toBeUndefined();
    expect(parseIsoDate("not-a-date")).toBeUndefined();
    expect(formatIsoDate(undefined)).toBe("");
  });
});
