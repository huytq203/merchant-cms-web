import type { ColumnDef } from "@tanstack/react-table";
import { Eye, QrCode } from "lucide-react";
import { DateTimeCell } from "@/components/page/DateTimeCell";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge, type StatusTone } from "@/components/page/StatusBadge";
import { formatAmount } from "@/lib/utils/helper";
import { BANK_OPTIONS, ORDER_STATUS_OPTIONS, labelOf } from "../constants/Order.constants";
import type { Order } from "../types/types";
import { canRefreshQr } from "../utils/order-mapper";

export type OrderColumnActions = {
  onView: (order: Order) => void;
  onViewQr: (order: Order) => void;
};

const statusTone: Record<Order["status"], StatusTone> = {
  PENDING: "neutral",
  ACTIVE: "warning",
  PAYMENT_CONFIRMED: "info",
  CREDIT_PENDING: "info",
  CREDIT_POSTING: "info",
  CREDIT_RECONCILIATION_REQUIRED: "danger",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const option = ORDER_STATUS_OPTIONS.find((item) => item.value === status);
  return (
    <StatusBadge label={option?.label} tone={option ? statusTone[status] : "neutral"} />
  );
}

function OrderRowActions({ order, actions }: { order: Order; actions: OrderColumnActions }) {
  const showQr = canRefreshQr(order.status);
  return <RowActions subject={`đơn ${order.orderCode}`} actions={[
    { label: "Xem chi tiết", icon: <Eye size={16} />, onClick: () => actions.onView(order) },
    { label: "Xem mã QR", icon: <QrCode size={16} />, visible: showQr, onClick: () => actions.onViewQr(order) },
  ]} />;
}

export function getOrderColumns(actions: OrderColumnActions, page: number, pageSize: number): ColumnDef<Order>[] {
  return [
    createIndexColumn<Order>({ page, pageSize }),
    {
      accessorKey: "orderCode",
      header: "Mã đơn hàng",
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderCode}</span>,
    },
    {
      id: "amount",
      header: "Số tiền",
      meta: { align: "right" },
      cell: ({ row }) => <span className="font-mono tabular-nums">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "bankCode",
      header: "Ngân hàng",
      cell: ({ row }) => labelOf(BANK_OPTIONS, row.original.bankCode),
    },
    { id: "createdAt", header: "Ngày tạo", cell: ({ row }) => <DateTimeCell value={row.original.createdAt} /> },
    { id: "expiredAt", header: "Hết hạn", cell: ({ row }) => <DateTimeCell value={row.original.expiredAt} /> },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <OrderRowActions order={row.original} actions={actions} />,
    },
  ];
}
