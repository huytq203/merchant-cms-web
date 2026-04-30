"use client";
import { Badge } from "@/components/ui/badge/Badge";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui";
import { formatAmount, formatDate } from "@/lib/utils/helper";
import {
  ORDER_SOURCE_OPTIONS,
  ORDER_STATUS_OPTIONS,
} from "../constants/Order.constants";
import type { Order } from "../types/types";

export function getOrderColumns(
  onViewDetail: (order: Order) => void,
): ColumnDef<Order>[] {
  return [
    {
      id: "code",
      header: "Mã đơn hàng",
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground text-sm">
          {row.original.code}
        </span>
      ),
      size: 160,
    },
    {
      id: "createdAt",
      header: "Thời gian tạo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
      size: 150,
    },
    {
      id: "source",
      header: "Nguồn",
      cell: ({ row }) => {
        const opt = ORDER_SOURCE_OPTIONS.find(
          (o) => o.value === row.original.source,
        );
        return (
          <Badge variant={opt?.variant ?? "outline"} size="sm">
            {opt?.label ?? row.original.source}
          </Badge>
        );
      },
      size: 120,
    },
    {
      id: "createdBy",
      header: "Người tạo",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.createdBy ?? "Hệ thống"}</span>
      ),
      size: 140,
    },
    {
      id: "amount",
      header: "Tổng thanh toán",
      meta: { align: "right" },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">
          {formatAmount(row.original.amount)}
        </span>
      ),
      size: 150,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const opt = ORDER_STATUS_OPTIONS.find(
          (o) => o.value === row.original.status,
        );
        return (
          <Badge variant={opt?.variant ?? "outline"}>
            {opt?.label ?? row.original.status}
          </Badge>
        );
      },
      size: 130,
    },
    {
      id: "actions",
      header: "",
      meta: { align: "center" },
      enableSorting: false,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          title="Xem chi tiết"
          onClick={() => onViewDetail(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
      size: 60,
    },
  ];
}
