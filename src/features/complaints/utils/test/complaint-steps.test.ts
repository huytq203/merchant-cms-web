import { describe, expect, it } from "vitest";

import { buildComplaintSteps } from "../complaint-steps";

const base = { createdAt: "2026-10-11T02:00:00Z", closedAt: "2026-10-12T04:00:00Z", verdict: null };

describe("buildComplaintSteps", () => {
  it("always starts with the creation, then waits for acceptance", () => {
    const steps = buildComplaintSteps({ ...base, status: "WAITING", closedAt: null });
    expect(steps.map((step) => [step.title, step.state])).toEqual([
      ["Gửi khiếu nại", "done"],
      ["Chờ tiếp nhận", "current"],
      ["Kết quả", "upcoming"],
    ]);
    expect(steps[0]?.time).toBe(base.createdAt);
  });

  it("shows the work in progress", () => {
    const steps = buildComplaintSteps({ ...base, status: "PROCESSING", closedAt: null });
    expect(steps.map((step) => step.state)).toEqual(["done", "current", "upcoming"]);
    expect(steps[1]?.title).toBe("Đang xử lý");
  });

  it("ends with the verdict and the closing time", () => {
    expect(buildComplaintSteps({ ...base, status: "CLOSED", verdict: "ACCEPTED" }).at(-1)).toEqual({
      title: "Đã kết thúc – Chấp nhận",
      time: base.closedAt,
      state: "done",
    });
    expect(buildComplaintSteps({ ...base, status: "CLOSED", verdict: "REJECTED" }).at(-1)).toMatchObject({
      title: "Đã kết thúc – Từ chối",
      state: "failed",
    });
  });

  it("ends a cancelled complaint without a verdict", () => {
    expect(buildComplaintSteps({ ...base, status: "CANCELLED" }).map((step) => step.title)).toEqual(["Gửi khiếu nại", "Đã hủy"]);
  });
});
