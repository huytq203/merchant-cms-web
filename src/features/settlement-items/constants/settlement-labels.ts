import type { StatusTone } from "@/components/page/StatusBadge";
import type { SettlementLineKind, SettlementLineStatus, TrancheGroup } from "../types";

/** Labels follow the BE comments ("Chờ quyết toán", "Đang giữ", "Sẵn sàng rút"); the rest are proposed in the FE doc. */
export const LINE_STATUS: Record<SettlementLineStatus, { label: string; tone: StatusTone }> = {
  PENDING_SETTLEMENT: { label: "Chờ quyết toán", tone: "info" },
  HELD: { label: "Đang giữ", tone: "warning" },
  READY: { label: "Sẵn sàng rút", tone: "success" },
  IN_WITHDRAWAL: { label: "Đã vào lệnh rút", tone: "neutral" },
  PAID: { label: "Đã chi", tone: "neutral" },
  CANCELLED: { label: "Đã hủy", tone: "danger" },
};

export const LINE_KIND_LABEL: Record<SettlementLineKind, string> = {
  FIRST_TRANCHE: "Đợt 1",
  HOLD_TRANCHE: "Đợt tạm giữ",
  REFUND: "Hoàn tiền",
  FEE_REFUND: "Hoàn phí",
  FREEZE: "Đóng băng",
  UNFREEZE: "Gỡ đóng băng",
};

/**
 * Nhóm trạng thái đợt trên bộ lọc và thanh phân bổ (mục 11), theo thứ tự tiền đi: chờ quyết toán → đang giữ → sẵn sàng
 * rút → đã vào lệnh rút. `statuses` là các trạng thái BE thuộc nhóm; `bar` là lớp màu token của đoạn trên thanh.
 */
export const TRANCHE_GROUPS: { value: TrancheGroup; label: string; statuses: SettlementLineStatus[]; bar: string }[] = [
  { value: "PENDING_SETTLEMENT", label: "Chờ quyết toán", statuses: ["PENDING_SETTLEMENT"], bar: "bg-info" },
  { value: "HELD", label: "Đang giữ", statuses: ["HELD"], bar: "bg-warning" },
  { value: "READY", label: "Sẵn sàng rút", statuses: ["READY"], bar: "bg-success" },
  { value: "IN_WITHDRAWAL", label: "Đã vào lệnh rút", statuses: ["IN_WITHDRAWAL", "PAID"], bar: "bg-primary" },
];

/** Trạng thái BE gửi lên cho một nhóm, nối bằng dấu phẩy (Spring đọc thành danh sách). */
export function trancheStatusesOf(group: TrancheGroup): string {
  return (TRANCHE_GROUPS.find((item) => item.value === group)?.statuses ?? [group]).join(",");
}

export const TERMINAL_TYPE_LABEL: Record<string, string> = { QR: "QR", POS: "POS", ONLINE: "Online" };
