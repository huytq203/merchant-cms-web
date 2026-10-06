import type { BadgeProps } from "@/components/ui/badge/Badge";
import type { WithdrawalStatus } from "../schemas/withdrawal.schema";

type StatusOption = { value: WithdrawalStatus; label: string; variant: BadgeProps["variant"] };

export const WITHDRAWAL_STATUS_OPTIONS: StatusOption[] = [
  { value: "PENDING", label: "Chờ duyệt", variant: "soft-warning" },
  { value: "APPROVED", label: "Đã duyệt", variant: "soft-primary" },
  { value: "REJECTED", label: "Từ chối", variant: "soft-danger" },
  { value: "FUNDS_RESERVING", label: "Đang giữ tiền", variant: "soft-primary" },
  { value: "FUNDS_RESERVED", label: "Đã giữ tiền", variant: "soft-primary" },
  { value: "BANK_SUBMITTING", label: "Đang gửi ngân hàng", variant: "soft-primary" },
  { value: "BANK_ACCEPTED", label: "Ngân hàng đã nhận", variant: "soft-primary" },
  { value: "BANK_REJECTED", label: "Ngân hàng từ chối", variant: "soft-danger" },
  { value: "PROCESSING", label: "Đang xử lý", variant: "soft-primary" },
  { value: "LEDGER_CAPTURING", label: "Đang ghi sổ", variant: "soft-primary" },
  { value: "FUNDS_RELEASING", label: "Đang hoàn tiền giữ", variant: "soft-warning" },
  { value: "RECONCILIATION_REQUIRED", label: "Cần đối soát", variant: "soft-danger" },
  { value: "COMPLETED", label: "Hoàn tất", variant: "soft-success" },
  { value: "FAILED", label: "Thất bại", variant: "soft-danger" },
];

export const REQUEST_TYPE_LABELS = {
  MANUAL: "Rút thường",
  AUTO_SWEEP: "Tự động",
} as const;

export const EMPTY_VALUE = "—";
