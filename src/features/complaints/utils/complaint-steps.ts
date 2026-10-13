import type { Complaint } from "../types/types";

export type ComplaintStep = {
  title: string;
  time?: string;
  state: "done" | "current" | "upcoming" | "failed";
};

/** The stages a complaint goes through, from what the complaint itself stores: creation, last update and status. */
export function buildComplaintSteps(complaint: Pick<Complaint, "status" | "createdAt" | "lastUpdatedAt">): ComplaintStep[] {
  const { status, createdAt, lastUpdatedAt } = complaint;
  const updated = lastUpdatedAt ? { time: lastUpdatedAt } : {};
  const intake: ComplaintStep = { title: "Hệ thống tiếp nhận khiếu nại", time: createdAt, state: "done" };
  switch (status) {
    case "pending":
      return [intake, { title: "Chờ tiếp nhận", state: "current" }, { title: "Kết quả", state: "upcoming" }];
    case "processing":
      return [intake, { title: "Đang xử lý", ...updated, state: "done" }, { title: "Kết quả", state: "upcoming" }];
    case "resolved":
      return [intake, { title: "Đang xử lý", state: "done" }, { title: "Đã xử lý", ...updated, state: "done" }];
    case "rejected":
      return [intake, { title: "Đang xử lý", state: "done" }, { title: "Bị từ chối", ...updated, state: "failed" }];
  }
}
