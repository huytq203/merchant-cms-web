"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { Input } from "@/components/ui/input/Input";
import type { BankConfirmKind } from "../hooks/use-bank-confirm";
import { bankAccountTitle } from "../utils/bank-mapper";
import type { BankErrorView } from "../utils/bank-errors";
import type { BankAccount } from "../types";
import { BankFailureAlert } from "./BankFailureAlert";

type Props = {
  kind: BankConfirmKind | null;
  account: BankAccount | null;
  isSubmitting: boolean;
  failure: BankErrorView | null;
  onConfirm: (reason: string | undefined) => void;
  onClose: () => void;
};

const copy = {
  delete: {
    title: "Xoá tài khoản ngân hàng",
    description: "Chỉ xoá được tài khoản chưa phát sinh giao dịch. Tài khoản đã dùng chỉ có thể ngừng sử dụng.",
    action: "Xoá tài khoản",
  },
  default: {
    title: "Đặt làm tài khoản mặc định",
    description: "Tiền quyết toán và rút tiền sẽ chuyển về tài khoản này.",
    action: "Đặt mặc định",
  },
} as const;

function ConfirmForm({ kind, account, isSubmitting, failure, onConfirm, onClose }: Props & { kind: BankConfirmKind; account: BankAccount }) {
  const [reason, setReason] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onConfirm(reason.trim() || undefined);
  };
  return (
    <form onSubmit={submit} className="mt-4 space-y-4">
      <p className="text-sm font-medium">{bankAccountTitle(account)}</p>
      <Input
        label="Lý do (không bắt buộc)"
        placeholder="Nhập lý do nếu có"
        maxLength={500}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <BankFailureAlert failure={failure} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Hủy
        </Button>
        <Button type="submit" variant={kind === "delete" ? "danger" : "solid"} isLoading={isSubmitting}>
          {copy[kind].action}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function BankConfirmDialog(props: Props) {
  const { kind, account, onClose } = props;
  return (
    <Dialog open={kind !== null && account !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {kind && account && (
          <>
            <DialogHeader>
              <DialogTitle>{copy[kind].title}</DialogTitle>
              <DialogDescription>{copy[kind].description}</DialogDescription>
            </DialogHeader>
            <ConfirmForm {...props} kind={kind} account={account} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
