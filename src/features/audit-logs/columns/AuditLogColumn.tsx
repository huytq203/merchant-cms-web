import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { DateTimeCell } from '@/components/page/DateTimeCell';
import { createIndexColumn } from '@/components/page/IndexColumn';
import { RowActions } from '@/components/page/RowActions';
import type { AuditLog } from '../types';
import { actionLabel, entityLabel } from '../utils/audit-mapper';

export function auditLogColumns(onView: (row: AuditLog) => void, page: number, pageSize: number): ColumnDef<AuditLog>[] {
  return [
    createIndexColumn<AuditLog>({ page, pageSize }),
    {
      accessorKey: 'occurredAt',
      header: 'Thời gian',
      cell: ({ row }) => <DateTimeCell value={row.original.occurredAt} />,
    },
    {
      accessorKey: 'actorLabel',
      header: 'Người thực hiện',
    },
    {
      accessorKey: 'action',
      header: 'Hành động',
      cell: ({ row }) => (
        <span title={row.original.reason ?? undefined}>
          {actionLabel(row.original.action)}
        </span>
      ),
    },
    {
      accessorKey: 'entityName',
      header: 'Phân hệ',
      cell: ({ row }) => <Badge variant="secondary">{entityLabel(row.original.entityName ?? '—')}</Badge>,
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
