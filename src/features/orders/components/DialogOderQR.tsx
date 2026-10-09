"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog/Dialog";
import { formatAmount } from "@/lib/utils/helper";
import { OrderQrSection, type OrderQrSectionProps } from "./OrderQrSection";

type Props = OrderQrSectionProps & { open: boolean; onOpenChange: (open: boolean) => void };

export function DialogOderQR({ open, onOpenChange, ...section }: Props) {
  const { order } = section;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mã QR thanh toán</DialogTitle>
          <DialogDescription>
            {order ? `Đơn ${order.orderCode} — ${formatAmount(order.amount)}` : "Đang tải đơn hàng"}
          </DialogDescription>
        </DialogHeader>
        <OrderQrSection {...section} />
      </DialogContent>
    </Dialog>
  );
}
