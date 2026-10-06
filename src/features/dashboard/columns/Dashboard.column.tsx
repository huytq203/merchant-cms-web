import { Badge } from "@/components/ui/badge/Badge"
import { CARD_TYPE_LABELS, TRANSACTION_STATUS_OPTIONS } from "@/features/transactions/constants/Transaction.constants"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { RecentTransaction } from "../types/Dashboard.type"

export const MerchantColumn: ColumnDef<RecentTransaction>[] = [
  {
    accessorKey: "code",
    header: "Mã giao dịch",
    size: 120,
  },
  {
    accessorKey: "customerName",
    header: "Khách hàng",
    size: 180,
  },
  {
    accessorKey: "cardType",
    header: "Loại thẻ",
    size: 100,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{CARD_TYPE_LABELS[row.original.cardType]}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
    size: 140,
    meta: { align: "right" },
    cell: ({ getValue }) => (
      <span className="font-semibold text-primary font-mono">
        {(getValue() as number).toLocaleString("vi-VN")}đ
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Thời gian",
    size: 180,
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string)
      return (
        <span className="text-sm">
          {format(date, "dd/MM/yyyy HH:mm:ss", { locale: vi })}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    size: 120,
    cell: ({ row }) => {
      const option = TRANSACTION_STATUS_OPTIONS.find((item) => item.value === row.original.status)
      return (
        <Badge variant={option?.variant ?? "outline"} size="sm">
          {option?.label ?? row.original.status}
        </Badge>
      )
    },
  },
]
