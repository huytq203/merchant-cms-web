import type { StatusTone } from "@/components/page/StatusBadge";
import type { FreezeReleaseStatus, FreezeStatus, FreezeStatusFilter } from "../types";

/** Vietnamese label and colour of each freeze state. */
export const FREEZE_STATUS: Record<FreezeStatus, { label: string; tone: StatusTone }> = {
  PROCESSING: { label: "Chờ xử lý", tone: "warning" },
  ACTIVE: { label: "Đang đóng băng", tone: "info" },
  RELEASED: { label: "Đã gỡ băng", tone: "success" },
  FAILED: { label: "Không thực hiện được", tone: "danger" },
};

/** Vietnamese label and colour of each release state. */
export const RELEASE_STATUS: Record<FreezeReleaseStatus, { label: string; tone: StatusTone }> = {
  PROCESSING: { label: "Đang xử lý", tone: "warning" },
  SUCCEEDED: { label: "Thành công", tone: "success" },
  FAILED: { label: "Thất bại", tone: "danger" },
};

export const DEFAULT_FREEZE_STATUS: FreezeStatusFilter = "ALL";

/** Filter choices, in the order a freeze goes through its life. */
export const FREEZE_STATUS_OPTIONS: { value: FreezeStatusFilter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "PROCESSING", label: FREEZE_STATUS.PROCESSING.label },
  { value: "ACTIVE", label: FREEZE_STATUS.ACTIVE.label },
  { value: "RELEASED", label: FREEZE_STATUS.RELEASED.label },
  { value: "FAILED", label: FREEZE_STATUS.FAILED.label },
];
