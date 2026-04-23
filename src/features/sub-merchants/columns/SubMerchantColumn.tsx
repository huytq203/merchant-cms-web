import { Badge } from "@/components/ui/badge/Badge";
import { cn } from "@/lib/utils/cn";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Edit, Eye, Trash2 } from "lucide-react";
import { SUB_MERCHANT_STATUS_OPTIONS } from "../constants/SubMerchant.constants";
import type { SubMerchant } from "../types";
import { maskPhone } from "@/lib/utils/helper";
import { Button } from "@/components/ui";

function formatDate(dateStr: string) {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
  } catch {
    return dateStr;
  }
}

export const getColumn = (
  onViewDetail: (item: SubMerchant) => void,
  onEdit: (item: SubMerchant) => void,
  onDelete: (item: SubMerchant) => void,
): ColumnDef<SubMerchant>[] => [
  {
    id: "id",
    header: "Mã SM",
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-primary text-sm">
        {row.original.id}
      </span>
    ),
    size: 130,
  },
  {
    id: "name",
    header: "Tên Sub-merchant",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-foreground">
        {row.original.name}
      </span>
    ),
    size: 220,
  },
  {
    id: "businessType",
    header: "Loại hình KD",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.businessType}
      </span>
    ),
    size: 160,
  },
  {
    id: "contact",
    header: "Liên hệ",
    cell: ({ row }) => (
      <span className="font-mono text-sm">
        {maskPhone(row.original.contact)}
      </span>
    ),
    size: 150,
  },
  {
    id: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    size: 140,
  },
  {
    id: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const option = SUB_MERCHANT_STATUS_OPTIONS.find(
        (o) => o.value === row.original.status,
      );
      return (
        <Badge variant={option?.variant ?? "outline"}>
          {option?.label ?? row.original.status}
        </Badge>
      );
    },
    size: 140,
  },
  {
    id: "actions",
    header: "",
    meta: { align: "center" },
    enableSorting: false,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="xs"
            variant="success-outline"
            onClick={() => onViewDetail(item)}
            title="Xem chi tiết"
            className="rounded-md"
          >
            <Eye className="h-3 w-3" />
            Chi tiết
          </Button>
          <Button
            size="xs"
            variant="info-outline"
            type="button"
            onClick={() => onEdit(item)}
            title="Chỉnh sửa"
            className="rounded-md"
          >
            <Edit className="h-3 w-3" />
            Sửa
          </Button>
          <Button
            onClick={() => onDelete(item)}
            title="Xóa"
            variant="danger-outline"
            size="xs"
            className="rounded-md"
          >
            <Trash2 className="h-3 w-3" />
            Xóa
          </Button>
        </div>
      );
    },
    size: 200,
  },
];
