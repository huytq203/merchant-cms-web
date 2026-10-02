'use client';
import { Badge } from '@/components/ui/badge/Badge';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import { COMPLAINT_SOURCE_OPTIONS, COMPLAINT_STATUS_OPTIONS } from '../constants/Complaint.constants';
import type { Complaint } from '../types/types';
import { cn } from '@/lib/utils/cn';
import { formatDate } from '@/lib/utils/helper';

export function getComplaintColumns(onViewDetail: (complaint: Complaint) => void): ColumnDef<Complaint>[] {
  return [
    {
      id: 'ticket',
      header: 'Mã Ticket / Ngày tạo',
      cell: ({ row }) => (
        <div>
          <p className="font-mono font-bold text-foreground text-sm">#{row.original.ticketCode}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(row.original.createdAt)}</p>
        </div>
      ),
      size: 180,
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => {
        const opt = COMPLAINT_SOURCE_OPTIONS.find((o) => o.value === row.original.source);
        return (
          <Badge variant={opt?.variant ?? 'secondary'} size="sm" className="uppercase tracking-wide">
            {opt?.label ?? row.original.source}
          </Badge>
        );
      },
      size: 120,
    },
    {
      id: 'content',
      header: 'Nội dung khiếu nại',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium line-clamp-2 max-w-[220px]">{row.original.content}</p>
          {row.original.transactionCode && (
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">GD: {row.original.transactionCode}</p>
          )}
        </div>
      ),
      size: 260,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const opt = COMPLAINT_STATUS_OPTIONS.find((o) => o.value === row.original.status);
        return (
          <div>
            <Badge variant={opt?.variant ?? 'outline'}>{opt?.label ?? row.original.status}</Badge>
            {row.original.note && (
              <p className="text-xs text-warning mt-1">• {row.original.note}</p>
            )}
          </div>
        );
      },
      size: 160,
    },
    {
      id: 'deadline',
      header: 'Thời hạn xử lý',
      cell: ({ row }) => {
        if (!row.original.deadline) return <span className="text-sm text-muted-foreground">—</span>;
        const isOverdue = new Date(row.original.deadline) < new Date();
        return (
          <span className={cn('text-sm font-medium flex items-center gap-1', isOverdue ? 'text-danger' : 'text-foreground')}>
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
            {formatDate(row.original.deadline)}
          </span>
        );
      },
      size: 150,
    },
    {
      id: 'lastUpdated',
      header: 'Cập nhật lần cuối',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastUpdatedAt ? formatDate(row.original.lastUpdatedAt) : '—'}
        </span>
      ),
      size: 150,
    },
    {
      id: 'actions',
      header: 'Hành động',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => (
        <span
          role="button"
          tabIndex={0}
          className="text-sm font-medium text-primary cursor-pointer hover:underline"
          onClick={() => onViewDetail(row.original)}
          onKeyDown={(e) => e.key === 'Enter' && onViewDetail(row.original)}
        >
          Chi tiết
        </span>
      ),
      size: 90,
    },
  ];
}
