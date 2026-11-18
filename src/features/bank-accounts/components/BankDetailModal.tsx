"use client";

import { DateTimeCell } from "@/components/page/DateTimeCell";
import { StatusBadge } from "@/components/page/StatusBadge";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { bankAccountStatusLabel, bankAccountStatusTone, bankDisplayName } from "../utils/bank-mapper";
import type { BankAccount } from "../types";

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

/**
 * Read only. The account number is shown exactly as the BE returns it (already masked). SRS v2: shows the Subs using
 * the account and, once verified (first successful withdrawal), when it was verified.
 */
export function BankDetailModal({ account, onClose }: Props) {
  return (
    <Dialog open={account !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết tài khoản ngân hàng</DialogTitle>
        </DialogHeader>
        {account && (
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Ngân hàng">{bankDisplayName(account.bankCode)}</Field>
            <Field label="Chi nhánh">{account.branchName || "—"}</Field>
            <Field label="Số tài khoản"><span className="font-mono">{account.accountNumber}</span></Field>
            <Field label="Chủ tài khoản">{account.accountName}</Field>
            <Field label="Trạng thái tài khoản">
              <StatusBadge label={bankAccountStatusLabel(account.accountStatus)} tone={bankAccountStatusTone(account.accountStatus)} />
            </Field>
            {account.accountStatus === "VERIFIED" && account.verifiedAt ? (
              <Field label="Thời điểm xác minh"><DateTimeCell value={account.verifiedAt} /></Field>
            ) : null}
            <Field label="Tài khoản mặc định">{yesNo(account.isDefault)}</Field>
            <Field label="Nhận được thanh toán">{yesNo(account.payable ?? account.accountStatus !== "LOCKED")}</Field>
            <Field label="Sub-merchant đang dùng" wide>
              {account.assignedSubMerchants.length === 0 ? (
                <span className="font-normal text-muted-foreground">Chưa gán</span>
              ) : (
                <ul className="space-y-0.5">
                  {account.assignedSubMerchants.map((sub) => (
                    <li key={sub.id}>{[sub.code, sub.name].filter(Boolean).join(" - ")}</li>
                  ))}
                </ul>
              )}
            </Field>
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
