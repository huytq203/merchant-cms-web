"use client";

import { DetailItem, DetailList, DetailModal, DetailSection } from "@/components/modal";
import { Notice } from "@/components/page/Notice";
import { Button } from "@/components/ui/button/Button";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { OrderStatusBadge } from "../columns/Order.column";
import { BANK_OPTIONS, PAYMENT_METHOD_OPTIONS, labelOf } from "../constants/Order.constants";
import { useNow } from "../hooks/use-now";
import type { Order } from "../types/types";
import { canCancelOrder, isOrderQrExpired } from "../utils/order-mapper";
import { orderNote } from "../utils/order-timeline";
import { OrderProgress } from "./OrderProgress";
import { OrderQrSection, type OrderQrSectionProps } from "./OrderQrSection";
import { OrderRefundActions } from "./OrderRefundActions";

type RefundProps = { canCreate: boolean; canView: boolean; onStart: (order: Order) => void };
type CancelProps = { canCancel: boolean; onStart: (order: Order) => void };
type Props = OrderQrSectionProps & { open: boolean; onOpenChange: (open: boolean) => void; refund: RefundProps; cancel: CancelProps };

const money = (value: number | null | undefined) => (value == null ? "Chưa có" : formatAmount(value));
const named = (code: string | null | undefined, name: string | null | undefined, empty: string) =>
  code || name ? [code, name].filter(Boolean).join(" — ") : empty;

function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="space-y-1 rounded-xl bg-secondary p-4">
      <p className="font-mono text-2xl font-bold tabular-nums text-brand-ink">{money(order.amount)}</p>
      <p className="text-sm text-muted-foreground">
        Thực nhận <b className="font-mono text-foreground">{money(order.netAmount)}</b> · Phí{" "}
        <b className="font-mono text-foreground">{money(order.feeAmount)}</b>
      </p>
    </div>
  );
}

function OrderFields({ order }: { order: Order }) {
  return (
    <DetailSection title="Thông tin đơn hàng">
      <DetailList>
        <DetailItem label="Nhận tiền về">{named(order.subMerchantCode, order.subMerchantName, "Chưa có")}</DetailItem>
        <DetailItem label="Terminal">{named(order.terminalCode, order.terminalName, "Không gắn Terminal")}</DetailItem>
        <DetailItem label="Phương thức">{labelOf(PAYMENT_METHOD_OPTIONS, order.acceptedPaymentMethod)}</DetailItem>
        <DetailItem label="Ngân hàng">{labelOf(BANK_OPTIONS, order.bankCode)}</DetailItem>
        <DetailItem label="Ngày tạo">{formatDate(order.createdAt)}</DetailItem>
        <DetailItem label="Hết hạn">{order.expiredAt ? formatDate(order.expiredAt) : "Không hết hạn"}</DetailItem>
        <DetailItem label="Mã giao dịch">{order.transactionCode || "Chưa có"}</DetailItem>
        <DetailItem label="Đơn vị">{order.merchantName || "Chưa có"}</DetailItem>
        <DetailItem label="Nội dung thanh toán" wide>
          {order.orderDescription || "Chưa có"}
        </DetailItem>
      </DetailList>
    </DetailSection>
  );
}

function OrderSections({ order, qr, refund, cancel }: { order: Order; qr: OrderQrSectionProps; refund: RefundProps; cancel: CancelProps }) {
  const now = useNow(order.status === "ACTIVE");
  const note = orderNote(order.status, isOrderQrExpired(order, now) && !qr.justRefreshed);
  return (
    <div className="space-y-4">
      <OrderSummary order={order} />
      <OrderProgress status={order.status} />
      <Notice tone={note.tone}>{note.text}</Notice>
      <OrderRefundActions orderId={order.id} status={order.status} canCreate={refund.canCreate} canView={refund.canView} onRefund={() => refund.onStart(order)} />
      {cancel.canCancel && canCancelOrder(order.status) ? (
        <Button type="button" variant="outline" onClick={() => cancel.onStart(order)}>Hủy đơn</Button>
      ) : null}
      {order.status === "ACTIVE" ? <OrderQrSection {...qr} /> : null}
      <OrderFields order={order} />
    </div>
  );
}

export function DialogOrderDetail({ open, onOpenChange, refund, cancel, ...qr }: Props) {
  const { order } = qr;
  return (
    <DetailModal
      open={open}
      onOpenChange={onOpenChange}
      header={{
        monogramInitials: order?.orderCode ?? "DH",
        title: "Chi tiết đơn hàng",
        code: order?.orderCode ?? "Chưa có mã",
        statusBadge: order ? <OrderStatusBadge status={order.status} /> : undefined,
      }}
      sections={order ? <OrderSections order={order} qr={qr} refund={refund} cancel={cancel} /> : null}
    />
  );
}
