import type { StatusTone } from "@/components/page/StatusBadge";
import type { HoldItemState, HoldRange } from "../types";

/** Quy tắc chung 10/11/2026: màn có thống kê theo ngày mặc định 7 ngày gần nhất. */
export const DEFAULT_HOLD_RANGE: HoldRange = "DAYS_7";

/** Số ngày của kỳ; null với "Tất cả". */
export const HOLD_RANGE_DAYS: Record<HoldRange, number | null> = { DAYS_7: 7, DAYS_30: 30, DAYS_90: 90, ALL: null };

export const HOLD_RANGE_OPTIONS: { value: HoldRange; label: string; period: string | null }[] = [
  { value: "DAYS_7", label: "7 ngày", period: "7 ngày" },
  { value: "DAYS_30", label: "30 ngày", period: "30 ngày" },
  { value: "DAYS_90", label: "90 ngày", period: "90 ngày" },
  { value: "ALL", label: "Tất cả", period: null },
];

export const WEEKDAY_LABEL: Record<string, string> = {
  MONDAY: "Thứ Hai",
  TUESDAY: "Thứ Ba",
  WEDNESDAY: "Thứ Tư",
  THURSDAY: "Thứ Năm",
  FRIDAY: "Thứ Sáu",
  SATURDAY: "Thứ Bảy",
  SUNDAY: "Chủ nhật",
};

/** Thứ viết tắt cho cột ngày, theo ngày VN (0 = Chủ nhật). */
export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Nhãn và tông của trạng thái một khoản tạm giữ (bốn trạng thái của BE). */
export const HOLD_ITEM_STATE: Record<HoldItemState, { label: string; tone: StatusTone }> = {
  HOLDING: { label: "Đang giữ", tone: "warning" },
  RELEASED: { label: "Đã giải phóng", tone: "success" },
  RELEASED_EARLY: { label: "Giải phóng sớm", tone: "success" },
  CANCELLED_BY_REFUND: { label: "Hủy do hoàn tiền", tone: "danger" },
};

/**
 * Nhãn đối chiếu sổ cái của lịch tạm giữ. `ledgerHeld = null` nghĩa là BE chưa đọc được số dư tạm giữ trên sổ cái
 * (Wallet Core không trả lời), nên không có gì để so: không được báo "Khớp sổ cái" dù cờ `reconciles` vẫn đúng.
 */
export function ledgerReconcileStatus(calendar: { reconciles: boolean; ledgerHeld: number | null }): { label: string; tone: StatusTone } {
  if (calendar.ledgerHeld === null) return { label: "Chưa đối soát được sổ cái", tone: "neutral" };
  return calendar.reconciles ? { label: "Khớp sổ cái", tone: "success" } : { label: "Lệch sổ cái", tone: "warning" };
}
