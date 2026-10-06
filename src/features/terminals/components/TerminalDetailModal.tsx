"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import type { TerminalDetail } from "../types";
import { terminalStatusLabel, terminalTypeLabel } from "../utils/terminal-mapper";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail?: TerminalDetail | null;
  error?: string;
  title?: string;
};

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function TerminalFields({ detail }: { detail: TerminalDetail }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
      <Field label="Terminal ID">{detail.tid}</Field>
      <Field label="Tên">{detail.name}</Field>
      <Field label="Loại">{terminalTypeLabel(detail.terminalType)}</Field>
      <Field label="Trạng thái">{terminalStatusLabel(detail)}</Field>
      <Field label="Sub-merchant">{detail.subMerchantName ?? detail.subMerchantCode}</Field>
      <Field label="Người liên hệ">{detail.contactPerson || "—"}</Field>
      <Field label="Địa chỉ" wide>{detail.address || "—"}</Field>
      <Field label="Số điện thoại" wide>{detail.contactPhone?.value || "—"}</Field>
    </dl>
  );
}

export function TerminalDetailModal({ open, onOpenChange, detail, error, title = "Chi tiết Terminal" }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {!error && !detail && <p role="status">Đang tải chi tiết...</p>}
        {detail && <TerminalFields detail={detail} />}
      </DialogContent>
    </Dialog>
  );
}
