"use client";

import { DetailItem, DetailList, DetailModal, DetailSection } from "@/components/modal";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { OrderStatusBadge } from "../columns/Order.column";
import { BANK_OPTIONS, labelOf } from "../constants/Order.constants";
import type { Order } from "../types/types";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; order: Order | null };
const money = (value: number | null | undefined) => value == null ? "Chưa có" : formatAmount(value);

function OrderFields({ order }: { order: Order }) {
  return <DetailSection title="Thông tin đơn hàng"><DetailList><DetailItem label="Mã đơn hàng">{order.orderCode}</DetailItem><DetailItem label="Trạng thái"><OrderStatusBadge status={order.status} /></DetailItem><DetailItem label="Số tiền">{money(order.amount)}</DetailItem><DetailItem label="Phí giao dịch">{money(order.feeAmount)}</DetailItem><DetailItem label="Số tiền thực nhận">{money(order.netAmount)}</DetailItem><DetailItem label="Ngân hàng">{labelOf(BANK_OPTIONS, order.bankCode)}</DetailItem><DetailItem label="Ngày tạo">{formatDate(order.createdAt)}</DetailItem><DetailItem label="Hết hạn">{formatDate(order.expiredAt)}</DetailItem><DetailItem label="Mã giao dịch">{order.transactionCode || "Chưa có"}</DetailItem><DetailItem label="Đơn vị">{order.merchantName || "Chưa có"}</DetailItem><DetailItem label="Nội dung thanh toán" wide>{order.orderDescription || "Chưa có"}</DetailItem></DetailList></DetailSection>;
}

export function DialogOrderDetail({ open, onOpenChange, order }: Props) {
  return <DetailModal open={open} onOpenChange={onOpenChange} header={{ monogramInitials: order?.orderCode ?? "DH", title: "Chi tiết đơn hàng", code: order?.orderCode ?? "Chưa có mã" }} sections={order ? <OrderFields order={order} /> : null} />;
}
