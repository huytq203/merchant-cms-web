'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip/Tooltip';
import { canEditGroup } from '../utils/permission-group-mapper';
import type { PermissionGroup } from '../schemas/permission-group.schema';

interface Actions {
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

function ActionButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function buildPermissionColumns(actions: Actions): ColumnDef<PermissionGroup>[] {
  return [
    { accessorKey: 'code', header: 'Mã nhóm' },
    { accessorKey: 'name', header: 'Tên nhóm quyền' },
    { accessorKey: 'description', header: 'Mô tả', cell: ({ row }) => row.original.description || 'Không có mô tả' },
    { id: 'scope', header: 'Cấp quản lý', cell: ({ row }) => row.original.system ? 'Hệ thống' : 'Merchant' },
    { id: 'permissionCount', header: 'Số quyền', cell: ({ row }) => row.original.permissions.length },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      cell: ({ row }) => (
        <div className="flex min-w-28 justify-center gap-1">
          <ActionButton label={`Xem ${row.original.name}`} onClick={() => actions.onView(row.original)}>
            <Eye className="h-4 w-4" />
          </ActionButton>
          {canEditGroup(row.original) ? (
            <>
              <ActionButton label={`Sửa ${row.original.name}`} onClick={() => actions.onEdit(row.original)}>
                <Pencil className="h-4 w-4" />
              </ActionButton>
              <ActionButton label={`Xoá ${row.original.name}`} onClick={() => actions.onDelete(row.original)}>
                <Trash2 className="h-4 w-4" />
              </ActionButton>
            </>
          ) : null}
        </div>
      ),
    },
  ];
}
