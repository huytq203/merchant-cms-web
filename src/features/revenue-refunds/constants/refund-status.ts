import type { StatusTone } from "@/components/page/StatusBadge";
import type { RefundGroup, RefundStatus } from "../types";

/**
 * Labels are the ones proposed in the FE doc (the BE has none). `next` tells the merchant what the state
 * means for them, since retrying, rejecting and paying the customer happen at Flexpay, not here.
 */
export const REFUND_STATUS: Record<RefundStatus, { label: string; tone: StatusTone; next?: string }> = {
  PENDING_APPROVAL: { label: "Chờ phê duyệt", tone: "info" },
  PROCESSING: { label: "Đang xử lý", tone: "neutral", next: "Đang ghi sổ, danh sách tự cập nhật." },
  ACCOUNTING_QUEUE: { label: "Chờ kế toán xử lý", tone: "warning", next: "Số dư khả dụng chưa đủ. Chưa trừ tiền, Flexpay sẽ xử lý tiếp." },
  SUCCEEDED: { label: "Thành công", tone: "success" },
  FAILED: { label: "Thất bại", tone: "danger", next: "Sổ cái không ghi nhận. Chưa trừ tiền, liên hệ Flexpay nếu cần hoàn lại." },
  REJECTED: { label: "Từ chối", tone: "danger" },
  CANCELLED: { label: "Đã hủy", tone: "neutral", next: "Đã rút lại trước khi phê duyệt. Không trừ tiền." },
};

export const REFUND_STATUS_OPTIONS = (Object.keys(REFUND_STATUS) as RefundStatus[]).map((value) => ({ value, label: REFUND_STATUS[value].label }));

export const PAYOUT_STATUS_LABEL = { PENDING: "Chờ chuyển tiền", PAID: "Đã chuyển tiền" } as const;

/**
 * Nhóm trạng thái của dải đếm (khớp BE /summary): "Đang xử lý" gồm cả hàng đợi Kế toán; nhóm cuối gom các yêu cầu
 * không còn hiệu lực (từ chối, thất bại, đã hủy).
 */
export const REFUND_GROUPS: Record<RefundGroup, { label: string; statuses: RefundStatus[]; tone: StatusTone }> = {
  PENDING: { label: "Chờ duyệt", statuses: ["PENDING_APPROVAL"], tone: "info" },
  PROCESSING: { label: "Đang xử lý", statuses: ["PROCESSING", "ACCOUNTING_QUEUE"], tone: "warning" },
  SUCCEEDED: { label: "Thành công", statuses: ["SUCCEEDED"], tone: "success" },
  FAILED: { label: "Từ chối/Thất bại", statuses: ["REJECTED", "FAILED", "CANCELLED"], tone: "danger" },
};
