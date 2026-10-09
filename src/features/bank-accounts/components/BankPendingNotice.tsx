import { Clock } from "lucide-react";
import { bankDisplayName, changeTypeLabel } from "../utils/bank-mapper";
import type { BankChangeRequest } from "../types";

type Props = { request: BankChangeRequest };

/** What Flexpay has been asked to approve, so the user is not left guessing why the account is locked. */
export function BankPendingNotice({ request }: Props) {
  const proposed = [
    request.proposedBankCode ? bankDisplayName(request.proposedBankCode) : null,
    request.proposedAccountNumber,
    request.proposedAccountName,
  ].filter(Boolean).join(" · ");
  return (
    <div role="status" className="flex gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="space-y-0.5">
        <p className="font-medium">Đang chờ Flexpay phê duyệt: {changeTypeLabel(request.changeType)}</p>
        {proposed && <p className="text-muted-foreground">{proposed}</p>}
        {request.requestReason && <p className="text-muted-foreground">Lý do: {request.requestReason}</p>}
        <p className="text-muted-foreground">Trong thời gian này chưa thể sửa hoặc đổi mặc định tài khoản.</p>
      </div>
    </div>
  );
}
