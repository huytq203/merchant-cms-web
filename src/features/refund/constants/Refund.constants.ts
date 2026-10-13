import type { StatusTone } from "@/components/page/StatusBadge";
import type { RefundStatus } from "../types/type";

export const REFUND_STATUS_OPTIONS: {
  value: RefundStatus;
  label: string;
  tone: StatusTone;
}[] = [
  { value: "pending", label: "Chờ phê duyệt", tone: "warning" },
  { value: "approved", label: "Đã duyệt", tone: "info" },
  { value: "rejected", label: "Từ chối", tone: "danger" },
  { value: "success", label: "Thành công", tone: "success" },
  { value: "cancelled", label: "Đã hủy", tone: "neutral" },
];
