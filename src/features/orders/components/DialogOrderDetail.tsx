"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { BANK_OPTIONS, labelOf } from "../constants/Order.constants";
import type { Order } from "../types/types";
import { OrderStatusBadge } from "../columns/Order.column";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; order: Order | null };

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

const money = (value: number | null | undefined) => (value == null ? "—" : formatAmount(value));

export function DialogOrderDetail({ open, onOpenChange, order }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết đơn hàng</DialogTitle>
        </DialogHeader>
        {order && (
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Field label="Mã đơn hàng">{order.orderCode}</Field>
            <Field label="Trạng thái">
              <OrderStatusBadge status={order.status} />
            </Field>
            <Field label="Số tiền">{money(order.amount)}</Field>
            <Field label="Phí giao dịch">{money(order.feeAmount)}</Field>
            <Field label="Số tiền thực nhận">{money(order.netAmount)}</Field>
            <Field label="Ngân hàng">{labelOf(BANK_OPTIONS, order.bankCode)}</Field>
            <Field label="Ngày tạo">{formatDate(order.createdAt)}</Field>
            <Field label="Hết hạn">{formatDate(order.expiredAt)}</Field>
            <Field label="Mã giao dịch">{order.transactionCode || "—"}</Field>
            <Field label="Đơn vị">{order.merchantName || "—"}</Field>
            <Field label="Nội dung thanh toán" wide>
              {order.orderDescription || "—"}
            </Field>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
