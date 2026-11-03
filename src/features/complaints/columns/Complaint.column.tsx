'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { cn } from '@/lib/utils/cn';
import { ComplaintStatusBadge } from '../components/ComplaintStatusBadge';
import { COMPLAINT_PARTY_LABELS, reasonLabel, waitingOnLabel } from '../constants/Complaint.constants';
import { describeDeadline } from '../utils/complaint-deadline';
import type { Complaint } from '../types/types';

const DEADLINE_CLASS = {
  late: 'bg-danger/10 text-danger',
  soon: 'bg-warning/15 text-warning',
  ok: 'bg-muted text-brand-ink',
} as const;

const stamp = (iso: string) => {
  // BE instants are UTC; date-fns renders them in the browser's (Vietnam) time zone.
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
            {row.original.complaintCode}
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
          <p className="text-sm font-medium">{reasonLabel(row.original.reasonCode)}</p>
          <p className="text-xs text-muted-foreground">{row.original.subMerchantName ?? '—'}</p>
        </div>
      ),
    },
    {
      id: 'reporter',
      header: 'Người gửi',
      cell: ({ row }) => <Badge variant="secondary">{COMPLAINT_PARTY_LABELS[row.original.reporterType]}</Badge>,
    },
    {
      id: 'deadline',
      header: 'Hạn xử lý',
      cell: ({ row }) => {
        const info = describeDeadline(row.original.deadlineAt, row.original.status, now);
        if (!info || !row.original.deadlineAt) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm tabular-nums">{format(new Date(row.original.deadlineAt), 'dd/MM/yyyy')}</p>
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
            {row.original.updatedAt ? `Cập nhật ${stamp(row.original.updatedAt)}` : 'Chưa cập nhật'}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        // While in progress, who the complaint waits on is the detail of the status.
        const waiting = row.original.status === 'PROCESSING' ? waitingOnLabel(row.original.waitingOn) : null;
        return (
          <div className="whitespace-nowrap">
            <ComplaintStatusBadge complaint={row.original} />
            {waiting && <p className="mt-1 text-xs text-muted-foreground">{waiting}</p>}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <RowAction
            label={`Chi tiết và phản hồi khiếu nại ${row.original.complaintCode}`}
            onClick={() => onViewDetail(row.original)}
          >
            <MessageSquare size={16} />
          </RowAction>
        </div>
      ),
    },
  ];
}
