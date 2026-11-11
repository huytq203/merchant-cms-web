"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { createIndexColumn } from "@/components/page/IndexColumn";
import { RowActions } from "@/components/page/RowActions";
import { canEditGroup, scopeLevelLabel } from "../utils/permission-group-mapper";
import type { PermissionGroup } from "../schemas/permission-group.schema";

interface Actions {
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

/** Tên nhóm, kèm mã nhóm ở dòng phụ khi BE gửi (BE thêm `code` vào danh sách nhóm của Portal ngày 11/11). */
export function PermissionGroupNameCell({ group }: { group: PermissionGroup }) {
  if (!group.code) return <>{group.name}</>;
  return (
    <div className="flex flex-col">
      <span>{group.name}</span>
      <span className="font-mono text-xs text-muted-foreground">{group.code}</span>
    </div>
  );
}

export function buildPermissionColumns(
  actions: Actions,
  page: number,
  pageSize: number,
): ColumnDef<PermissionGroup>[] {
  return [
    createIndexColumn<PermissionGroup>({ page, pageSize }),
    {
      accessorKey: "name",
      header: "Tên nhóm quyền",
      size: 50,
      cell: ({ row }) => <PermissionGroupNameCell group={row.original} />,
    },
    {
      accessorKey: "description",
      header: "Mô tả",
      cell: ({ row }) => row.original.description || "Không có mô tả",
    },
    {
      id: "origin",
      header: "Loại nhóm",
      cell: ({ row }) => (row.original.system ? "Hệ thống" : "Merchant"),
    },
    {
      id: "scopeLevel",
      header: "Cấp quản lý",
      cell: ({ row }) => scopeLevelLabel(row.original.scopeLevel),
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
