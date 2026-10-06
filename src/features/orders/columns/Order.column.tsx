import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { Button } from "@/components/ui/button/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/Tooltip";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import { BANK_OPTIONS, ORDER_STATUS_OPTIONS, labelOf } from "../constants/Order.constants";
import type { Order } from "../types/types";
import { canRefreshQr } from "../utils/order-mapper";

export type OrderColumnActions = {
  onView: (order: Order) => void;
  onViewQr: (order: Order) => void;
};

type ActionProps = { label: string; onClick: () => void; children: ReactNode };

function Action({ label, onClick, children }: ActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function Slot({ children }: { children?: ReactNode }) {
  return <span className="inline-flex h-8 w-8 items-center justify-center">{children}</span>;
}

export function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const option = ORDER_STATUS_OPTIONS.find((item) => item.value === status);
  return (
    <Badge variant={option?.variant ?? "outline"} className="w-44 justify-center">
      {option?.label ?? "Không xác định"}
    </Badge>
  );
}

function RowActions({ order, actions }: { order: Order; actions: OrderColumnActions }) {
  const showQr = canRefreshQr(order.status);
  return (
    <div className="flex items-center gap-1">
      <Action label={`Xem chi tiết đơn ${order.orderCode}`} onClick={() => actions.onView(order)}>
        <Eye size={16} />
      </Action>
      {showQr ? (
        <Action label={`Xem mã QR đơn ${order.orderCode}`} onClick={() => actions.onViewQr(order)}>
          <QrCode size={16} />
        </Action>
      ) : <Slot />}
    </div>
  );
}

export function getOrderColumns(actions: OrderColumnActions): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "orderCode",
      header: "Mã đơn hàng",
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.orderCode}</span>,
    },
    {
      id: "amount",
      header: "Số tiền",
      cell: ({ row }) => <span className="font-mono">{formatAmount(row.original.amount)}</span>,
    },
    {
      id: "bankCode",
      header: "Ngân hàng",
      cell: ({ row }) => labelOf(BANK_OPTIONS, row.original.bankCode),
    },
    { id: "createdAt", header: "Ngày tạo", cell: ({ row }) => formatDate(row.original.createdAt) },
    { id: "expiredAt", header: "Hết hạn", cell: ({ row }) => formatDate(row.original.expiredAt) },
    { id: "status", header: "Trạng thái", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
    {
      id: "actions",
      header: "Thao tác",
      enableSorting: false,
      cell: ({ row }) => <RowActions order={row.original} actions={actions} />,
    },
  ];
}
