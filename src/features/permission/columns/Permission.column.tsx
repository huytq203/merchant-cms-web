import { ColumnDef } from "@tanstack/react-table";
import { PermissionData } from "../types/type";
import { Button } from "@/components/ui";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge/Badge";
import { PERMISSION_LABEL, PermissionStatus } from "../constants/Permission.constant";
import { formatDate } from "@/lib/utils/helper";

export function buildPermissionColumns<T = string>(
  onEdit: (item: PermissionData<T>) => void,
): ColumnDef<PermissionData<T>>[] {
  return [
    {
      header: "Tên nhóm quyền",
      accessorKey: "name",
    },
    {
      header: "Số người dùng",
      accessorKey: "userCount",
    },
    {
      header: "Ngày tạo",
      accessorKey: "createdAt",
      cell: ({ row }) => <div>{formatDate(row.original.createdAt)}</div>,
    },
    {
      header: "Trạng thái",
      accessorKey: "status",
      meta: { align: "center" },
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === PermissionStatus?.ACTIVE
              ? "soft-success"
              : "soft-danger"
          }
        >
          {PERMISSION_LABEL[row.original.status as PermissionStatus]}
        </Badge>
      ),
    },
    {
      header: "Hành động",
      accessorKey: "action",
      size: 100,
      meta: { align: "center" },
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="info-outline"
          leftIcon={<Pencil className="h-4 w-4" />}
          className="rounded-md"
          onClick={() => onEdit(row.original)}
        >
          Chỉnh sửa
        </Button>
      ),
    },
  ];
}
