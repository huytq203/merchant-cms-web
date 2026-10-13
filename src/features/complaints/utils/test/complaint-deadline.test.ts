import { describe, expect, it } from "vitest";

import { describeDeadline } from "../complaint-deadline";

const NOW = new Date("2026-10-12T08:00:00Z");

describe("describeDeadline", () => {
  it("says how long is left, in days or hours", () => {
    expect(describeDeadline("2026-10-14T08:00:00Z", "processing", NOW)).toEqual({ tone: "ok", label: "Còn 2 ngày" });
    expect(describeDeadline("2026-10-12T19:00:00Z", "pending", NOW)).toEqual({ tone: "soon", label: "Còn 11 giờ" });
  });

  it("warns when the last day begins", () => {
    expect(describeDeadline("2026-10-13T07:00:00Z", "processing", NOW)?.tone).toBe("soon");
    expect(describeDeadline("2026-10-13T09:00:00Z", "processing", NOW)?.tone).toBe("ok");
  });

  it("says how late it is once the deadline has passed", () => {
    expect(describeDeadline("2026-10-12T05:00:00Z", "processing", NOW)).toEqual({ tone: "late", label: "Quá hạn 3 giờ" });
    expect(describeDeadline("2026-10-09T08:00:00Z", "pending", NOW)).toEqual({ tone: "late", label: "Quá hạn 3 ngày" });
  });

  it("has nothing to say for a closed complaint, a missing deadline or an invalid one", () => {
    expect(describeDeadline("2026-10-09T08:00:00Z", "resolved", NOW)).toBeNull();
    expect(describeDeadline("2026-10-09T08:00:00Z", "rejected", NOW)).toBeNull();
    expect(describeDeadline(null, "pending", NOW)).toBeNull();
    expect(describeDeadline("not a date", "pending", NOW)).toBeNull();
  });
});
