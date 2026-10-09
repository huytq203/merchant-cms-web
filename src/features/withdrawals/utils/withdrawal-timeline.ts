import type { StepState } from "@/components/page/StepProgress";
import type { WithdrawalStatus } from "../schemas/withdrawal.schema";

export const WITHDRAWAL_STEPS = ["Gửi yêu cầu", "Được duyệt", "Giữ tiền", "Gửi ngân hàng", "Hoàn tất"] as const;

/** Index of the step a request is on; equal to the step count once it is complete. A failed one stops at `current`. */
const POSITION: Record<WithdrawalStatus, { current: number; failed?: boolean }> = {
  PENDING: { current: 1 },
  APPROVED: { current: 2 },
  FUNDS_RESERVING: { current: 2 },
  FUNDS_RESERVED: { current: 3 },
  BANK_SUBMITTING: { current: 3 },
  PROCESSING: { current: 3 },
  BANK_ACCEPTED: { current: 4 },
  LEDGER_CAPTURING: { current: 4 },
  COMPLETED: { current: WITHDRAWAL_STEPS.length },
  REJECTED: { current: 1, failed: true },
  BANK_REJECTED: { current: 3, failed: true },
  FUNDS_RELEASING: { current: 3, failed: true },
  FAILED: { current: 3, failed: true },
  RECONCILIATION_REQUIRED: { current: 3, failed: true },
};

export function withdrawalStepStates(status: WithdrawalStatus): StepState[] {
  const { current, failed } = POSITION[status];
  return WITHDRAWAL_STEPS.map((_, index) => {
    if (index < current) return "done";
    if (index > current) return "upcoming";
    return failed ? "failed" : "current";
  });
}

export type WithdrawalNote = { tone: "info" | "warning" | "danger" | "success"; text: string };

/** What a status means for the merchant and whether they have to do anything. */
export function withdrawalNote(status: WithdrawalStatus): WithdrawalNote {
  switch (status) {
    case "PENDING":
      return { tone: "info", text: "Yêu cầu đang chờ người có thẩm quyền của Flexpay duyệt. Bạn chỉ theo dõi trạng thái." };
    case "APPROVED":
    case "FUNDS_RESERVING":
      return { tone: "info", text: "Yêu cầu đã được duyệt. Hệ thống đang giữ tiền trong ví để chuyển đi." };
    case "FUNDS_RESERVED":
    case "BANK_SUBMITTING":
    case "PROCESSING":
      return { tone: "info", text: "Tiền đã được giữ. Hệ thống đang gửi lệnh chuyển sang ngân hàng." };
    case "BANK_ACCEPTED":
    case "LEDGER_CAPTURING":
      return { tone: "info", text: "Ngân hàng đã nhận lệnh chuyển. Hệ thống đang ghi sổ để hoàn tất." };
    case "COMPLETED":
      return { tone: "success", text: "Ngân hàng đã chuyển tiền về tài khoản của bạn." };
    case "REJECTED":
      return { tone: "danger", text: "Yêu cầu bị từ chối. Tiền trong ví không bị trừ." };
    case "BANK_REJECTED":
    case "FAILED":
      return {
        tone: "danger",
        text: "Chuyển tiền không thành công. Khoản tiền giữ được hoàn lại ví. Bạn kiểm tra tài khoản nhận rồi tạo yêu cầu mới.",
      };
    case "FUNDS_RELEASING":
      return { tone: "warning", text: "Chuyển tiền không thành công. Hệ thống đang hoàn khoản tiền giữ về ví của bạn." };
    case "RECONCILIATION_REQUIRED":
      return {
        tone: "warning",
        text: "Flexpay đang đối soát yêu cầu này với ngân hàng. Bạn không cần làm gì, kết quả sẽ cập nhật ở đây.",
      };
  }
}
