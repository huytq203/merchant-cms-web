import { StatusBadge } from "@/components/page/StatusBadge";
import { WITHDRAWAL_STATUS_OPTIONS, groupOfStatus } from "../constants/Withdrawal.constants";
import type { WithdrawalStatus } from "../types/types";

/** The exact BE status as the label; its stage gives the colour. */
export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const label = WITHDRAWAL_STATUS_OPTIONS.find((item) => item.value === status)?.label;
  return <StatusBadge label={label} tone={groupOfStatus(status)?.tone ?? "neutral"} />;
}
