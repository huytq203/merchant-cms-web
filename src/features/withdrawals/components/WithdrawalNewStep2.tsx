"use client";

import type { ReactNode } from "react";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount } from "@/lib/utils/helper";
import { EMPTY_VALUE } from "../constants/Withdrawal.constants";
import type { WithdrawalCreateFlow } from "../hooks/use-withdrawal-create-flow";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/** Step 2: read the request back. Continuing sends the email code. */
export function WithdrawalNewStep2({ flow }: { flow: WithdrawalCreateFlow }) {
  const { values, selectedBank, otpFailure, isRequestingCode } = flow;
  const bankText = selectedBank
    ? `${bankDisplayName(selectedBank.bankCode)} ${selectedBank.accountNumberMasked}`
    : EMPTY_VALUE;

  return (
    <div className="mt-2 space-y-4">
      <div className="rounded-xl border border-border bg-secondary px-4 py-3">
        <p className="text-sm text-muted-foreground">Số tiền rút</p>
        <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{formatAmount(Number(values.amount))}</p>
        <p className="text-sm text-muted-foreground">Phí do hệ thống tính khi gửi yêu cầu và cộng thêm vào số tiền rút.</p>
      </div>
      <dl>
        <Row label="Tài khoản nhận">{bankText}</Row>
        <Row label="Chủ tài khoản">{selectedBank?.accountName ?? EMPTY_VALUE}</Row>
        <Row label="Ghi chú">{values.reason.trim() || EMPTY_VALUE}</Row>
      </dl>
      <Notice tone="info">
        Yêu cầu ở trạng thái <b>Chờ duyệt</b> cho đến khi người có thẩm quyền của Flexpay duyệt. Bạn theo dõi trạng thái trong danh sách.
      </Notice>
      {otpFailure ? <Notice tone="danger">{otpFailure}</Notice> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={flow.back} disabled={isRequestingCode}>
          Quay lại
        </Button>
        <Button type="button" variant="solid" isLoading={isRequestingCode} onClick={() => void flow.sendCode()}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
