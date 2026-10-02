import { Badge } from "@/components/ui/badge/Badge"
import { Transaction } from "@/features/transactions/types"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

export const MerchantColumn: ColumnDef<Transaction>[] = [
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
    cell: ({ getValue }) => (
      <span className="text-sm font-medium">{getValue() as string}</span>
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
    cell: ({ getValue }) => {
      const status = getValue() as string
      const variants: Record<string, "soft-success" | "soft-warning" | "soft-danger"> = {
        success: "soft-success",
        pending: "soft-warning",
        failed: "soft-danger",
      }
      const labels: Record<string, string> = {
        success: "Thành công",
        pending: "Đang xử lý",
        failed: "Thất bại",
      }
      return (
        <Badge variant={variants[status] || "default"} size="sm">
          {labels[status] || status}
        </Badge>
      )
    },
  },
]