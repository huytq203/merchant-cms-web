'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge/Badge';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { formatDate } from '@/lib/utils/helper';
import { COMPLAINT_STATUS_OPTIONS } from '../constants/Complaint.constants';
import type { Complaint } from '../types/types';

export function getComplaintColumns(onViewDetail: (complaint: Complaint) => void): ColumnDef<Complaint>[] {
  return [
    {
      id: 'ticket',
      header: 'Mã khiếu nại',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.ticketCode}</span>,
    },
    {
      id: 'transaction',
      header: 'Mã giao dịch',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.transactionCode ?? '—'}</span>,
    },
    {
      id: 'subMerchant',
      header: 'Sub-merchant',
      cell: ({ row }) => row.original.subMerchantName,
    },
    {
      id: 'reason',
      header: 'Lý do tra soát',
      cell: ({ row }) => <span title={row.original.reason}>{row.original.reason}</span>,
    },
    {
      id: 'created',
      header: 'Ngày tạo',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'updated',
      header: 'Cập nhật',
      cell: ({ row }) => row.original.lastUpdatedAt ? formatDate(row.original.lastUpdatedAt) : '—',
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const option = COMPLAINT_STATUS_OPTIONS.find(({ value }) => value === row.original.status);
        return <Badge variant={option?.variant ?? 'outline'}>{option?.label ?? row.original.status}</Badge>;
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
