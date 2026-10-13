import { StatusBadge } from "@/components/page/StatusBadge";
import { REFUND_STATUS_OPTIONS } from "../constants/Refund.constants";
import type { RefundStatus } from "../types/type";

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const option = REFUND_STATUS_OPTIONS.find((item) => item.value === status);
  return <StatusBadge label={option?.label ?? status} tone={option?.tone ?? "neutral"} />;
}
