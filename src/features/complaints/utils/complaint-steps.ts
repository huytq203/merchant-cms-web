import { COMPLAINT_VERDICT_LABELS } from "../constants/Complaint.constants";
import type { Complaint } from "../types/types";

export type ComplaintStep = {
  title: string;
  time?: string;
  state: "done" | "current" | "upcoming" | "failed";
};

type StepSource = Pick<Complaint, "status" | "verdict" | "createdAt" | "closedAt">;

/**
 * The stages a complaint goes through, from what the portal record carries: creation, status and the
 * closing time. The portal record has no acceptance time, so "Đang xử lý" shows none.
 */
export function buildComplaintSteps(complaint: StepSource): ComplaintStep[] {
  const { status, verdict, createdAt, closedAt } = complaint;
  const closed = closedAt ? { time: closedAt } : {};
  const intake: ComplaintStep = { title: "Gửi khiếu nại", time: createdAt, state: "done" };
  switch (status) {
    case "WAITING":
      return [intake, { title: "Chờ tiếp nhận", state: "current" }, { title: "Kết quả", state: "upcoming" }];
    case "PROCESSING":
      return [intake, { title: "Đang xử lý", state: "current" }, { title: "Kết quả", state: "upcoming" }];
    case "CLOSED": {
      const title = verdict ? `Đã kết thúc – ${COMPLAINT_VERDICT_LABELS[verdict]}` : "Đã kết thúc";
      return [intake, { title: "Đang xử lý", state: "done" }, { title, ...closed, state: verdict === "REJECTED" ? "failed" : "done" }];
    }
    case "CANCELLED":
      return [intake, { title: "Đã hủy", ...closed, state: "failed" }];
  }
}
