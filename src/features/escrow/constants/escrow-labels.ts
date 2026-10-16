import type { StatusTone } from "@/components/page/StatusBadge";
import type { EscrowLedgerKind, EscrowState } from "../types";

export const ESCROW_STATE: Record<EscrowState, { label: string; tone: StatusTone }> = {
  NOT_CONFIGURED: { label: "Chưa cấu hình", tone: "neutral" },
  SHORT: { label: "Còn thiếu", tone: "warning" },
  MET: { label: "Đủ", tone: "success" },
  SURPLUS: { label: "Dư", tone: "success" },
  UNKNOWN: { label: "Chưa xác định", tone: "neutral" },
};

/** Money coming back to the merchant is not an error, so a return is neutral rather than danger. */
export const ESCROW_LEDGER_KIND: Record<EscrowLedgerKind, { label: string; tone: StatusTone }> = {
  DEPOSIT_TRANSFER: { label: "Nạp chuyển khoản", tone: "success" },
  DEPOSIT_SUB_REVENUE: { label: "Nạp từ doanh thu Sub", tone: "info" },
  WITHDRAWAL_SETOFF: { label: "Cấn trừ tại lệnh rút", tone: "warning" },
  RETURN: { label: "Hoàn trả ký quỹ", tone: "neutral" },
  TERMINATION_DEDUCTION: { label: "Khấu trừ khi chấm dứt", tone: "danger" },
  ADJUSTMENT: { label: "Điều chỉnh", tone: "neutral" },
};

export const ESCROW_FORM_LABEL: Record<string, string> = {
  TRANSFER: "Chuyển khoản",
  SUB_REVENUE: "Từ doanh thu Sub",
  SETOFF: "Cấn trừ",
};
