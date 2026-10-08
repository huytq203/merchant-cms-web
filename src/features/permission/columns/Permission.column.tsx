"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { canEditGroup } from "../utils/permission-group-mapper";
import type { PermissionGroup } from "../schemas/permission-group.schema";

interface Actions {
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

export function buildPermissionColumns(
  actions: Actions,
  page: number,
  pageSize: number,
): ColumnDef<PermissionGroup>[] {
  return [
    createIndexColumn<PermissionGroup>({ page, pageSize }),
    { accessorKey: "name", header: "Tên nhóm quyền" , size: 50,},
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => row.original.description || "Không có mô tả",
    },
    {
      id: "scope",
      header: "Cấp quản lý",
      cell: ({ row }) => (row.original.system ? "Hệ thống" : "Merchant"),
    },
    {
      id: "permissionCount",
      header: "Số quyền",
      cell: ({ row }) => row.original.permissions.length,
    },
    {
      id: "actions",
      header: "Thao tác",
      size: 1000,
      meta: { align: "center" },
      cell: ({ row }) => {
        const editable = canEditGroup(row.original);
        return (
          <RowActions
            subject={row.original.name}
            actions={[
              {
                label: "Xem",
                icon: <Eye className="h-4 w-4" />,
                onClick: () => actions.onView(row.original),
              },
              {
                label: "Sửa",
                icon: <Pencil className="h-4 w-4" />,
                visible: editable,
                onClick: () => actions.onEdit(row.original),
              },
              {
                label: "Xoá",
                icon: <Trash2 className="h-4 w-4" />,
                visible: editable,
                onClick: () => actions.onDelete(row.original),
              },
            ]}
          />
        );
      },
    },
  ];
}
