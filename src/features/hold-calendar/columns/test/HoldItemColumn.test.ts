import { describe, expect, it } from "vitest";
import { holdItemSchema } from "../../schemas";
import { holdItemFixture, releasedItemFixture } from "../../test/fixtures";
import { holdStateLabel, releaseDayLabel, vnDay } from "../HoldItemColumn";

describe("hold item labels", () => {
  it("reads the Vietnam day of an instant, whatever the machine time zone", () => {
    expect(vnDay("2026-10-15T17:00:00Z")).toBe("2026-10-16");
    expect(releaseDayLabel("2026-10-15T17:00:00Z")).toBe("16/10/2026 (T6)");
  });

  it("shows a dash rather than failing when the BE sends no date", () => {
    expect(vnDay(null)).toBeNull();
    expect(vnDay("không phải ngày")).toBeNull();
    expect(releaseDayLabel(undefined)).toBe("—");
    const item = holdItemSchema.parse({ ...holdItemFixture, eventAt: null, holdReleaseAt: null });
    expect(holdStateLabel(item, "2026-10-13")).toBe("Đang giữ");
  });

  it("says how long a hold has left and when a released one went out", () => {
    expect(holdStateLabel(holdItemSchema.parse(holdItemFixture), "2026-10-13")).toBe("Đang giữ · còn 3 ngày");
    expect(holdStateLabel(holdItemSchema.parse(holdItemFixture), "2026-10-16")).toBe("Đang giữ · đến hạn hôm nay");
    expect(holdStateLabel(holdItemSchema.parse(releasedItemFixture), "2026-10-13")).toBe("Đã giải phóng 12/10 00:00");
  });
});
