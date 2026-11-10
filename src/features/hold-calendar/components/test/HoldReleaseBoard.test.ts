import { describe, expect, it } from "vitest";
import { holdCalendarSchema } from "../../schemas";
import { calendarFixture } from "../../test/fixtures";
import { chartRows, itemFilter } from "../HoldReleaseBoard";

const calendar = holdCalendarSchema.parse({
  ...calendarFixture,
  releasedByDay: [{ date: "2026-10-11", count: 1, amount: 10_000 }],
});

describe("hold release board", () => {
  // Cột xám lấy từ releasedByDay của BE (đủ cửa sổ đã qua), không cộng từ trang danh sách đang xem.
  it("draws the released days from the BE only when asked", () => {
    expect(chartRows(calendar, false).map((row) => row.day)).toEqual(["13/10", "15/10", "16/10", "18/10"]);
    const shown = chartRows(calendar, true);
    expect(shown[0]).toEqual({ day: "11/10", "Đã giải phóng": 10_000, "Sẽ giải phóng": 0 });
    expect(shown).toHaveLength(5);
  });

  it("asks for holds only until the end of the range, and everything since pastFrom once released are shown", () => {
    expect(itemFilter(calendar, "2026-10-13", false, 1)).toEqual({ state: "HOLDING", to: "2026-11-11", page: 1, pageSize: 20 });
    expect(itemFilter(calendar, "2026-10-13", true, 2, "s")).toEqual({
      subMerchantId: "s", state: "ALL", from: "2026-09-14", to: "2026-11-11", page: 2, pageSize: 20,
    });
  });
});
