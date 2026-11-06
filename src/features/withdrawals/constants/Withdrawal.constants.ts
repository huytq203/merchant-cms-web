import type { BadgeProps } from "@/components/ui/badge/Badge";
import type { StatusTone } from "@/components/page/StatusBadge";
import type { WithdrawalStatus, WithdrawalStatusGroup } from "../schemas/withdrawal.schema";

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
  // AUTO_SWEEP: made by the 01:00 job for a Sub in automatic settlement mode (chốt 03/11/2026).
  AUTO_SWEEP: "Rút tự động",
} as const;

export const EMPTY_VALUE = "—";

/**
 * The 14 BE statuses are steps of one payout pipeline. The merchant filters by the stage a request is in;
 * the table and detail still show the exact status.
 */
export const WITHDRAWAL_STATUS_GROUPS: {
  value: WithdrawalStatusGroup;
  label: string;
  tone: StatusTone;
  statuses: readonly WithdrawalStatus[];
}[] = [
  { value: "PENDING", label: "Chờ duyệt", tone: "warning", statuses: ["PENDING"] },
  {
    value: "PROCESSING",
    label: "Đang xử lý",
    tone: "info",
    statuses: [
      "APPROVED", "FUNDS_RESERVING", "FUNDS_RESERVED", "BANK_SUBMITTING", "BANK_ACCEPTED",
      "PROCESSING", "LEDGER_CAPTURING", "FUNDS_RELEASING",
    ],
  },
  { value: "COMPLETED", label: "Hoàn tất", tone: "success", statuses: ["COMPLETED"] },
  { value: "REJECTED", label: "Bị từ chối hoặc thất bại", tone: "danger", statuses: ["REJECTED", "BANK_REJECTED", "FAILED"] },
  { value: "RECONCILIATION", label: "Cần đối soát", tone: "warning", statuses: ["RECONCILIATION_REQUIRED"] },
];

export function groupOfStatus(status: WithdrawalStatus) {
  return WITHDRAWAL_STATUS_GROUPS.find((group) => group.statuses.includes(status));
}
