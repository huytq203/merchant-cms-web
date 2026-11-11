import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { DateTimeCell } from '@/components/page/DateTimeCell';
import { createIndexColumn } from '@/components/page/IndexColumn';
import { RowActions } from '@/components/page/RowActions';
import type { AuditLog } from '../types';
import { actionLabel, actorName, categoryLabel, changeText, entityHint, entityLabel } from '../utils/audit-mapper';

/**
 * Cột theo mockup mục 6: Thời gian, Nhóm (pill), Đối tượng, Hành động, Nội dung, Người thực hiện.
 * Nội dung (11/11/2026) là tóm tắt thay đổi BE dựng sẵn, để bảng không còn chỉ "Người dùng b0ef6e6e · Cập nhật".
 */
export function auditLogColumns(onView: (row: AuditLog) => void, page: number, pageSize: number): ColumnDef<AuditLog>[] {
  return [
    createIndexColumn<AuditLog>({ page, pageSize }),
    {
      accessorKey: 'occurredAt',
      header: 'Thời gian',
      cell: ({ row }) => <DateTimeCell value={row.original.occurredAt} />,
    },
    {
      accessorKey: 'category',
      header: 'Nhóm',
      cell: ({ row }) => <Badge variant="secondary">{categoryLabel(row.original.category)}</Badge>,
    },
    {
      accessorKey: 'entityName',
      header: 'Đối tượng',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p>{entityLabel(row.original.entityName ?? '—')}</p>
          {entityHint(row.original) && (
            <p className="max-w-xs truncate text-xs text-muted-foreground" title={entityHint(row.original) ?? undefined}>
              {entityHint(row.original)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Hành động',
      cell: ({ row }) => actionLabel(row.original.action),
    },
    {
      id: 'change',
      header: 'Nội dung',
      enableSorting: false,
      cell: ({ row }) => {
        const text = changeText(row.original);
        // Tối đa 2 dòng trong bảng; đủ nội dung ở tooltip và màn chi tiết.
        return text
          ? <p className="line-clamp-2 max-w-sm text-sm" title={text}>{text}</p>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'actor',
      header: 'Người thực hiện',
      cell: ({ row }) => actorName(row.original),
    },
    {
      id: 'actions',
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <RowActions
          subject=""
          actions={[{
            label: `Xem chi tiết nhật ký lúc ${format(new Date(row.original.occurredAt), 'HH:mm dd/MM')}`,
            icon: <Eye size={16} />,
            onClick: () => onView(row.original),
          }]}
        />
      ),
    },
  ];
}
