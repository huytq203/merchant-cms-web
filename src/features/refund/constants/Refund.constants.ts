import type { BadgeProps } from "@/components/ui/badge/Badge";
import type { RefundStatus } from "../types/type";

export const REFUND_STATUS_OPTIONS: {
  value: RefundStatus;
  label: string;
  variant: BadgeProps["variant"];
}[] = [
  { value: "pending", label: "Chờ phê duyệt", variant: "soft-warning" },
  { value: "approved", label: "Đã duyệt", variant: "soft-primary" },
  { value: "rejected", label: "Từ chối", variant: "soft-danger" },
  { value: "success", label: "Thành công", variant: "soft-success" },
];
