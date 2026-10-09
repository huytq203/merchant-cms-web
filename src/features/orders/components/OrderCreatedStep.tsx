"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button/Button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog/Dialog";
import { formatAmount } from "@/lib/utils/helper";
import { useNow } from "../hooks/use-now";
import type { Order } from "../types/types";
import { OrderQrPanel } from "./OrderQrPanel";

type Props = { order: Order; onViewDetail: () => void; onCreateAnother: () => void };

/** Result of creating an order: the QR to show the customer, with the fee and what the merchant receives. */
export function OrderCreatedStep({ order, onViewDetail, onCreateAnother }: Props) {
  const now = useNow(true);
  const rows: [string, string][] = [
    ["Số tiền khách trả", formatAmount(order.amount)],
    ["Phí giao dịch", order.feeAmount == null ? "Chưa có" : formatAmount(order.feeAmount)],
    ["Thực nhận", order.netAmount == null ? "Chưa có" : formatAmount(order.netAmount)],
  ];
  return (
    <>
      <DialogHeader className="items-center text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={26} aria-hidden="true" />
        </span>
        <DialogTitle>Đã tạo đơn {order.orderCode}</DialogTitle>
        <DialogDescription>Đưa mã QR này cho khách quét để thanh toán.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {order.qrCode ? <OrderQrPanel order={order} qrValue={order.qrCode} now={now} /> : null}
        <dl className="grid gap-1.5 rounded-xl border border-border bg-secondary p-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <DialogFooter className="mt-4 justify-center">
        <Button type="button" variant="outline" onClick={onViewDetail}>
          Xem chi tiết
        </Button>
        <Button type="button" variant="solid" onClick={onCreateAnother}>
          Tạo đơn khác
        </Button>
      </DialogFooter>
    </>
  );
}
