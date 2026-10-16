import type { StatusTone } from "@/components/page/StatusBadge";
import type { SettlementLineKind, SettlementLineStatus } from "../types";

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
};
