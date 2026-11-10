import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Eye, QrCode, Undo2 } from "lucide-react";
import { DateTimeCell } from "@/components/page/DateTimeCell";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { StatusBadge, type StatusTone } from "@/components/page/StatusBadge";
import { formatAmount } from "@/lib/utils/helper";
import { ORDER_STATUS_DISPLAY_OPTIONS, PAYMENT_METHOD_OPTIONS, labelOf } from "../constants/Order.constants";
import type { Order } from "../types/types";
import { canCancelOrder, canRefreshQr } from "../utils/order-mapper";

export type OrderColumnActions = {
  onView: (order: Order) => void;
  onViewQr: (order: Order) => void;
  /** Present only for a session with CANCEL_ORDER. */
  onCancel?: (order: Order) => void;
  /** Present only for a session with CREATE_REFUND; the row shows it for a paid (SUCCESS) order. */
  onRefund?: (order: Order) => void;
};

const statusTone: Record<Order["status"], StatusTone> = {
  PENDING: "neutral",
  ACTIVE: "warning",
  PAYMENT_CONFIRMED: "info",
  CREDIT_PENDING: "info",
  CREDIT_POSTING: "info",
  CREDIT_RECONCILIATION_REQUIRED: "info", // alias chuyển tiếp, gỡ sau 1 sprint: như CREDIT_POSTING
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const option = ORDER_STATUS_DISPLAY_OPTIONS.find((item) => item.value === status);
  return (
    <StatusBadge label={option?.label} tone={option ? statusTone[status] : "neutral"} />
  );
}

function SubMerchantCell({ order }: { order: Order }) {
  if (!order.subMerchantCode && !order.subMerchantName) return "—";
  return (
    <div className="min-w-0">
      <p className="font-mono text-xs text-muted-foreground">{order.subMerchantCode}</p>
      <p>{order.subMerchantName}</p>
    </div>
  );
}

function OrderRowActions({ order, actions }: { order: Order; actions: OrderColumnActions }) {
  const showQr = canRefreshQr(order.status);
  return <RowActions subject={`đơn ${order.orderCode}`} actions={[
    { label: "Xem chi tiết", icon: <Eye size={16} />, onClick: () => actions.onView(order) },
    { label: "Xem mã QR", icon: <QrCode size={16} />, visible: showQr, onClick: () => actions.onViewQr(order) },
    // Chỉ đơn đã thanh toán thành công mới hoàn được; quyền CREATE_REFUND quyết định có truyền onRefund hay không.
    { label: "Hoàn tiền", icon: <Undo2 size={16} />, visible: Boolean(actions.onRefund) && order.status === "SUCCESS", onClick: () => actions.onRefund?.(order) },
    { label: "Hủy", icon: <Ban size={16} />, visible: Boolean(actions.onCancel) && canCancelOrder(order.status), onClick: () => actions.onCancel?.(order) },
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
      id: "paymentMethod",
      header: "Phương thức",
      cell: ({ row }) => labelOf(PAYMENT_METHOD_OPTIONS, row.original.acceptedPaymentMethod),
    },
    {
      id: "subMerchant",
      header: "Nhận tiền về",
      cell: ({ row }) => <SubMerchantCell order={row.original} />,
    },
    { id: "createdAt", header: "Ngày tạo", cell: ({ row }) => <DateTimeCell value={row.original.createdAt} /> },
    { id: "paidAt", header: "Thời gian thanh toán", cell: ({ row }) => (row.original.paidAt ? <DateTimeCell value={row.original.paidAt} /> : "—") },
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
