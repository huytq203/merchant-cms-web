import { describe, expect, it } from "vitest";
import { formatVnDate, formatVnDateTime, shiftVnDate, vnToday } from "../vn-time";

describe("Vietnam time formatting", () => {
  it("shows a UTC instant in Vietnam time with the year", () => {
    expect(formatVnDateTime("2026-10-13T03:00:00Z")).toBe("13/10/2026 10:00");
    expect(formatVnDateTime("2026-12-31T18:30:00Z")).toBe("01/01/2027 01:30");
  });

  it("shows only the date when asked", () => {
    expect(formatVnDate("2026-10-12T20:00:00Z")).toBe("13/10/2026");
  });

  it("keeps a plain yyyy-MM-dd date as the same calendar day", () => {
    expect(formatVnDate("2026-10-15")).toBe("15/10/2026");
  });

  it("gives today's Vietnam date and shifts calendar days", () => {
    expect(vnToday(new Date("2026-10-13T17:30:00Z"))).toBe("2026-10-14");
    expect(shiftVnDate("2026-10-14", -6)).toBe("2026-10-08");
    expect(shiftVnDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns the empty marker for a missing or broken value", () => {
    expect(formatVnDateTime(null)).toBe("—");
    expect(formatVnDate("not-a-date")).toBe("—");
  });
});
