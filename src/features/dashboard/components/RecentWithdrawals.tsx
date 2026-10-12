import { Card } from "@/components/ui/card/Card";
import { WithdrawalStatusBadge } from "@/features/withdrawals/components/WithdrawalStatusBadge";
import { domainErrorMessage } from "@/lib/be/errors";
import { formatAmount } from "@/lib/utils/helper";
import { getWithdrawalSnapshot } from "@/server/modules/dashboard/dashboard.service";
import { formatVnTime } from "../utils/format";
import { RegionError } from "./RegionError";
import { RecentList } from "./RecentList";

export async function RecentWithdrawals() {
  const result = await getWithdrawalSnapshot();
  if (!result.success) {
    return <Card><RegionError message={`Không tải được yêu cầu rút tiền. ${domainErrorMessage(result.error)}`} /></Card>;
  }
  const rows = result.data.recent.map((withdrawal) => ({
    id: withdrawal.id,
    primary: withdrawal.transactionCode ?? "—",
    secondary: `${withdrawal.bankCode} ${withdrawal.bankAccountMasked} · ${formatVnTime(withdrawal.createdAt)}`,
    badge: <WithdrawalStatusBadge status={withdrawal.status} />,
    amount: formatAmount(withdrawal.amount),
  }));
  return <RecentList title="Rút tiền gần nhất" href="/withdrawal" rows={rows} emptyMessage="Chưa có yêu cầu rút tiền nào." />;
}
