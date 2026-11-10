import { describe, expect, it } from "vitest";

import { describeChange, formatVnTime } from "../format";

describe("formatVnTime", () => {
  it("giữ nguyên giờ VN khi chuỗi BE không có múi giờ (không cộng +7 lần hai)", () => {
    expect(formatVnTime("2026-11-10T16:13:00")).toBe("16:13 10/11");
    expect(formatVnTime("2026-11-06T10:50:12.345678")).toBe("10:50 06/11");
    expect(formatVnTime("2026-11-10T15:19:00+07:00")).toBe("15:19 10/11");
  });

  it("shows Vietnam time whatever the server zone", () => {
    expect(formatVnTime("2026-10-12T07:12:00Z")).toBe("14:12 12/10");
    expect(formatVnTime("2026-10-11T18:05:00Z")).toBe("01:05 12/10");
  });

  it("falls back for a missing or invalid time", () => {
    expect(formatVnTime(null)).toBe("—");
    expect(formatVnTime("nope")).toBe("—");
  });
});

describe("describeChange", () => {
  it("compares today with yesterday", () => {
    expect(describeChange(31, 24)).toEqual({ text: "+7 đơn so với hôm qua", direction: "up" });
    expect(describeChange(2, 5)).toEqual({ text: "−3 đơn so với hôm qua", direction: "down" });
    expect(describeChange(4, 4)).toEqual({ text: "bằng hôm qua", direction: "flat" });
  });
});
