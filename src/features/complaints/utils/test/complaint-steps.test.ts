import { describe, expect, it } from "vitest";

import { buildComplaintSteps } from "../complaint-steps";

const base = { createdAt: "2026-10-11T02:00:00Z", lastUpdatedAt: "2026-10-12T04:00:00Z" };

describe("buildComplaintSteps", () => {
  it("always starts with the intake, then waits for acceptance", () => {
    const steps = buildComplaintSteps({ ...base, status: "pending", lastUpdatedAt: null });
    expect(steps.map((step) => [step.title, step.state])).toEqual([
      ["Hệ thống tiếp nhận khiếu nại", "done"],
      ["Chờ tiếp nhận", "current"],
      ["Kết quả", "upcoming"],
    ]);
  });

  it("shows the work in progress with the last update time", () => {
    const steps = buildComplaintSteps({ ...base, status: "processing" });
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "upcoming"]);
    expect(steps[1]).toMatchObject({ title: "Đang xử lý", time: base.lastUpdatedAt });
  });

  it("ends with the outcome", () => {
    expect(buildComplaintSteps({ ...base, status: "resolved" }).at(-1)).toMatchObject({ title: "Đã xử lý", state: "done", time: base.lastUpdatedAt });
    expect(buildComplaintSteps({ ...base, status: "rejected" }).at(-1)).toMatchObject({ title: "Bị từ chối", state: "failed", time: base.lastUpdatedAt });
  });
});
