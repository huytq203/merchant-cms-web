"use client";

import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { bankDisplayName, bankLinkLabel, bankStatusLabel } from "../utils/bank-mapper";
import type { BankAccount } from "../types";
import { BankAccountScopeLabel } from "./BankAccountScopeLabel";
import { BankPendingNotice } from "./BankPendingNotice";

type Props = { account: BankAccount | null; onClose: () => void };

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

const yesNo = (value: boolean | undefined): string => (value ? "Có" : "Không");

/** Read only. The account number is shown exactly as the BE returns it (already masked). */
export function BankDetailModal({ account, onClose }: Props) {
  return (
    <Dialog open={account !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết tài khoản ngân hàng</DialogTitle>
        </DialogHeader>
        {account?.pendingChangeRequest && <BankPendingNotice request={account.pendingChangeRequest} />}
        {account && (
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Áp dụng cho"><BankAccountScopeLabel account={account} /></Field>
            <Field label="Ngân hàng">{bankDisplayName(account.bankCode)}</Field>
            <Field label="Chi nhánh">{account.branchName || "—"}</Field>
            <Field label="Số tài khoản"><span className="font-mono">{account.accountNumber}</span></Field>
            <Field label="Chủ tài khoản">{account.accountName}</Field>
            <Field label="Trạng thái liên kết">{bankLinkLabel(account)}</Field>
            <Field label="Trạng thái sử dụng">{bankStatusLabel(account.status)}</Field>
            <Field label="Tài khoản mặc định">{yesNo(account.isDefault)}</Field>
            <Field label="Nhận được thanh toán">{yesNo(account.payable)}</Field>
          </dl>
        )}
        <DialogFooter>
          <Button type="button" variant="solid" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
