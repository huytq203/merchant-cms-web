import { describe, expect, it } from "vitest";
import { formatNotificationTime } from "../format-time";

const now = new Date("2026-10-26T10:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatNotificationTime", () => {
  it("says just now under a minute, including a clock slightly ahead of the BE", () => {
    expect(formatNotificationTime(ago(20_000), now)).toBe("Vừa xong");
    expect(formatNotificationTime(ago(-5_000), now)).toBe("Vừa xong");
  });

  it("counts minutes, hours and days", () => {
    expect(formatNotificationTime(ago(5 * MINUTE), now)).toBe("5 phút trước");
    expect(formatNotificationTime(ago(59 * MINUTE), now)).toBe("59 phút trước");
    expect(formatNotificationTime(ago(3 * HOUR), now)).toBe("3 giờ trước");
    expect(formatNotificationTime(ago(2 * DAY), now)).toBe("2 ngày trước");
  });

  it("switches to the date and time after a week", () => {
    expect(formatNotificationTime("2026-10-10T03:05:00Z", now)).toMatch(/^\d{2}\/\d{2}\/2026 \d{2}:\d{2}$/);
  });

  it("returns an empty string for a value that is not a date", () => {
    expect(formatNotificationTime("không phải ngày", now)).toBe("");
  });
});
