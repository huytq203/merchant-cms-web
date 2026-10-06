import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { Button } from '@/components/ui/button/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip/Tooltip';
import type { AuditLog } from '../types';
import { actionLabel, entityLabel } from '../utils/audit-mapper';

function ViewDetailAction({ row, onView }: { row: AuditLog; onView: (row: AuditLog) => void }) {
  const label = `Xem chi tiết nhật ký lúc ${format(new Date(row.occurredAt), 'HH:mm dd/MM')}`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={() => onView(row)}
          />
        }
      >
        <Eye size={16} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function auditLogColumns(onView: (row: AuditLog) => void): ColumnDef<AuditLog>[] {
  return [
    {
      accessorKey: 'occurredAt',
      header: 'Thời gian',
      cell: ({ row }) => format(new Date(row.original.occurredAt), 'dd/MM/yyyy HH:mm:ss'),
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
      id: 'detail',
      header: 'Chi tiết',
      enableSorting: false,
      cell: ({ row }) => <ViewDetailAction row={row.original} onView={onView} />,
    },
  ];
}
