"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { bankDisplayName } from "@/features/bank-accounts/utils/bank-mapper";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { EMPTY_VALUE, REQUEST_TYPE_LABELS } from "../constants/Withdrawal.constants";
import { useWithdrawalDetail } from "../hooks/use-withdrawal-detail";
import type { Withdrawal } from "../types/types";
import { isAwaitingApproval, withdrawalTotalDebit } from "../utils/withdrawal-mapper";
import { WithdrawalStatusBadge } from "./WithdrawalStatusBadge";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; listed: Withdrawal | null };

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

const money = (value: number | null) => (value === null ? EMPTY_VALUE : formatAmount(value));

function WithdrawalFields({ withdrawal }: { withdrawal: Withdrawal }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
      <Field label="Mã giao dịch">{withdrawal.transactionCode ?? "Chờ cấp mã"}</Field>
      <Field label="Trạng thái">
        <WithdrawalStatusBadge status={withdrawal.status} />
      </Field>
      <Field label="Số tiền rút">{formatAmount(withdrawal.amount)}</Field>
      <Field label="Phí rút">{money(withdrawal.fee)}</Field>
      <Field label="Tổng trừ ví">{money(withdrawalTotalDebit(withdrawal))}</Field>
      <Field label="Hình thức">{REQUEST_TYPE_LABELS[withdrawal.requestType]}</Field>
      <Field label="Tài khoản nhận">
        {bankDisplayName(withdrawal.bankCode)} {withdrawal.bankAccountMasked}
      </Field>
      <Field label="Chủ tài khoản">{withdrawal.bankAccountName}</Field>
      <Field label="Ngày yêu cầu">{formatDate(withdrawal.createdAt)}</Field>
      <Field label="Mã tham chiếu ngân hàng">{withdrawal.bankRefId ?? EMPTY_VALUE}</Field>
      <Field label="Ghi chú" wide>
        {withdrawal.reason ?? EMPTY_VALUE}
      </Field>
    </dl>
  );
}

export function WithdrawalDetailModal({ open, onOpenChange, listed }: Props) {
  const { withdrawal, loadError } = useWithdrawalDetail(listed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
        </DialogHeader>
        {withdrawal && <WithdrawalFields withdrawal={withdrawal} />}
        {withdrawal && isAwaitingApproval(withdrawal.status) && (
          <p className="mt-4 text-sm text-muted-foreground">
            Yêu cầu đang chờ người có thẩm quyền duyệt. Bạn chỉ có thể theo dõi trạng thái.
          </p>
        )}
        {loadError && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {loadError}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
