"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { DialogTitle } from "@/components/ui/dialog/Dialog";
import { formatAmount } from "@/lib/utils/helper";
import { EMPTY_VALUE } from "../constants/Withdrawal.constants";
import type { Withdrawal } from "../types/types";
import { withdrawalBreakdown } from "../utils/withdrawal-mapper";
import { WithdrawalStatusBadge } from "./WithdrawalStatusBadge";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

type Props = { withdrawal: Withdrawal; onViewDetail: () => void; onClose: () => void };

/** Result of sending a request: the code, the setoff and fee BE worked out (both inside the amount) and the net payout. */
export function WithdrawalSentStep({ withdrawal, onViewDetail, onClose }: Props) {
  const { setoff, fee, net } = withdrawalBreakdown(withdrawal);
  return (
    <div className="grid justify-items-center gap-3 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={26} aria-hidden="true" />
      </span>
      <DialogTitle>Đã gửi yêu cầu rút tiền</DialogTitle>
      <p className="text-sm text-muted-foreground">Yêu cầu đang chờ duyệt. Bạn theo dõi trạng thái trong danh sách.</p>
      <dl className="grid w-full gap-1.5 rounded-xl border border-border bg-secondary p-4 text-left">
        <Row label="Mã giao dịch">{withdrawal.transactionCode ?? "Chờ cấp mã"}</Row>
        <Row label="Số tiền rút">{formatAmount(withdrawal.amount)}</Row>
        <Row label="Cấn trừ ký quỹ">{formatAmount(setoff)}</Row>
        <Row label="Phí rút">{fee === null ? EMPTY_VALUE : formatAmount(fee)}</Row>
        <Row label="Thực nhận">{net === null ? EMPTY_VALUE : formatAmount(net)}</Row>
        <div className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-muted-foreground">Trạng thái</dt>
          <dd><WithdrawalStatusBadge status={withdrawal.status} /></dd>
        </div>
      </dl>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onViewDetail}>
          Xem chi tiết
        </Button>
        <Button type="button" variant="solid" onClick={onClose}>
          Về danh sách
        </Button>
      </div>
    </div>
  );
}
