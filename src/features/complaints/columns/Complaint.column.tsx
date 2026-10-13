'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { cn } from '@/lib/utils/cn';
import { ComplaintStatusBadge } from '../components/ComplaintStatusBadge';
import { COMPLAINT_SOURCE_OPTIONS } from '../constants/Complaint.constants';
import { describeDeadline } from '../utils/complaint-deadline';
import type { Complaint } from '../types/types';

const DEADLINE_CLASS = {
  late: 'bg-danger/10 text-danger',
  soon: 'bg-warning/15 text-warning',
  ok: 'bg-muted text-brand-ink',
} as const;

const stamp = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : `${format(date, 'HH:mm')} ${format(date, 'dd/MM/yyyy')}`;
};

export function getComplaintColumns(onViewDetail: (complaint: Complaint) => void, now: Date): ColumnDef<Complaint>[] {
  return [
    {
      id: 'ticket',
      header: 'Mã khiếu nại',
      cell: ({ row }) => (
        <div>
          <button
            type="button"
            className="font-mono text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => onViewDetail(row.original)}
          >
            {row.original.ticketCode}
          </button>
          <p className="font-mono text-xs text-muted-foreground">{row.original.transactionCode ?? '—'}</p>
        </div>
      ),
    },
    {
      id: 'reason',
      header: 'Lý do / Sub-merchant',
      cell: ({ row }) => (
        <div className="min-w-[150px]">
          <p className="text-sm font-medium" title={row.original.reason}>{row.original.reason}</p>
          <p className="text-xs text-muted-foreground">{row.original.subMerchantName}</p>
        </div>
      ),
    },
    {
      id: 'source',
      header: 'Nguồn',
      cell: ({ row }) => {
        const option = COMPLAINT_SOURCE_OPTIONS.find(({ value }) => value === row.original.source);
        return <Badge variant={option?.variant ?? 'outline'}>{option?.label ?? row.original.source}</Badge>;
      },
    },
    {
      id: 'deadline',
      header: 'Hạn xử lý',
      cell: ({ row }) => {
        const info = describeDeadline(row.original.deadline, row.original.status, now);
        if (!info || !row.original.deadline) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm tabular-nums">{format(new Date(row.original.deadline), 'dd/MM/yyyy')}</p>
            <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', DEADLINE_CLASS[info.tone])}>
              {info.label}
            </span>
          </div>
        );
      },
    },
    {
      id: 'created',
      header: 'Ngày tạo',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm tabular-nums">{stamp(row.original.createdAt)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {row.original.lastUpdatedAt ? `Cập nhật ${stamp(row.original.lastUpdatedAt)}` : 'Chưa cập nhật'}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <ComplaintStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RowAction
            label={`Chi tiết và phản hồi khiếu nại ${row.original.ticketCode}`}
            onClick={() => onViewDetail(row.original)}
          >
            <MessageSquare size={16} />
          </RowAction>
        </div>
      ),
    },
  ];
}
