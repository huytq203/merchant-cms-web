import { Badge } from "@/components/ui/badge/Badge";
import { WITHDRAWAL_STATUS_OPTIONS } from "../constants/Withdrawal.constants";
import type { WithdrawalStatus } from "../types/types";

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  const option = WITHDRAWAL_STATUS_OPTIONS.find((item) => item.value === status);
  return (
    <Badge variant={option?.variant ?? "outline"} className="w-44 justify-center">
      {option?.label ?? "Không xác định"}
    </Badge>
  );
}
