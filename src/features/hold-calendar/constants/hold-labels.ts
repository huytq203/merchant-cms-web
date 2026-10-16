import type { HoldRange } from "../types";

export const DEFAULT_HOLD_RANGE: HoldRange = "DAYS_30";

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
