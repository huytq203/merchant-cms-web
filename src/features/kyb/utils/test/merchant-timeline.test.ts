import { describe, expect, it } from "vitest";
import { merchantTimeline } from "../merchant-timeline";

const history = [
  { toStatus: "PENDING_APPROVAL" as const, occurredAt: "2026-01-09T11:24:00" },
  { toStatus: "REJECTED" as const, reason: "Thiếu giấy tờ", occurredAt: "2026-01-10T08:00:00" },
  { toStatus: "PENDING_APPROVAL" as const, occurredAt: "2026-01-12T09:30:00" },
];

describe("merchant timeline", () => {
  it("has no progress for a draft", () => {
    expect(merchantTimeline({ status: "DRAFT" }, [])).toEqual([]);
  });

  it("shows the latest submission time while pending", () => {
    const steps = merchantTimeline({ status: "PENDING_APPROVAL" }, history);
    expect(steps).toHaveLength(3);
    expect(steps[0]?.time).toBe("2026-01-12T09:30:00");
    expect(steps[1]?.variant).toBe("warning");
  });

  it("ends in a danger step carrying the rejection reason", () => {
    const steps = merchantTimeline(
      { status: "REJECTED", rejectedReasonDetail: "Thiếu giấy tờ", rejectedAt: "2026-01-10T08:00:00" },
      history,
    );
    expect(steps.at(-1)).toMatchObject({ variant: "danger", description: "Thiếu giấy tờ" });
  });

  it("ends in a success step once active", () => {
    expect(merchantTimeline({ status: "ACTIVE" }, history).at(-1)?.variant).toBe("success");
  });
});
