'use client';
import { Badge } from '@/components/ui/badge/Badge';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Trash2 } from 'lucide-react';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { formatAmount } from '@/lib/utils/helper';
import { REFUND_STATUS_OPTIONS } from '../constants/Refund.constants';
import type { Refund } from '../types/type';

export type RefundColumnActions = {
  canCancel: boolean;
  onViewDetail: (refund: Refund) => void;
  onCancelRefund: (refund: Refund) => void;
};

function Slot() {
  return <span className="inline-block h-8 w-8" aria-hidden="true" />;
}

function RowActions({ refund, actions }: { refund: Refund; actions: RefundColumnActions }) {
  const showCancel = actions.canCancel && refund.status === 'pending';
  return (
    <div className="flex items-center justify-center gap-1">
      <RowAction label={`Xem chi tiết hoàn tiền ${refund.code}`} onClick={() => actions.onViewDetail(refund)}>
        <Eye size={16} />
      </RowAction>
      {showCancel ? (
        <RowAction
          label={`Hủy yêu cầu hoàn tiền ${refund.code}`}
          tone="danger"
          onClick={() => actions.onCancelRefund(refund)}
        >
          <Trash2 size={16} />
        </RowAction>
      ) : (
        <Slot />
      )}
    </div>
  );
}

export function getRefundColumns(actions: RefundColumnActions, pageOffset = 0): ColumnDef<Refund>[] {
  return [
    {
      id: 'index',
      header: 'STT',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.index + 1 + pageOffset}</span>
      ),
      size: 52,
    },
    {
      id: 'code',
      header: 'Mã Hoàn tiền',
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-primary text-sm">{row.original.code}</span>
      ),
      size: 150,
    },
    {
      id: 'transactionCode',
      header: 'Mã GD / HĐ',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm">{row.original.transactionCode}</span>
          <p className="font-mono text-xs text-muted-foreground">{row.original.invoiceCode ?? '—'}</p>
        </div>
      ),
      size: 165,
    },
    {
      id: 'requestAmount',
      header: 'Số tiền yêu cầu',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm">{formatAmount(row.original.requestAmount)}</span>
      ),
      size: 140,
    },
    {
      id: 'actualAmount',
      header: 'Số tiền thực hoàn',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono font-semibold text-sm text-danger">{formatAmount(row.original.actualAmount)}</span>
      ),
      size: 150,
    },
    {
      id: 'fees',
      header: 'Phí hoàn (MB/NM)',
      cell: ({ row }) => (
        <div className="font-mono text-xs text-muted-foreground">
          <p>MB {row.original.feeMb.toLocaleString('vi-VN')}</p>
          <p>NM {row.original.feeNm.toLocaleString('vi-VN')}</p>
        </div>
      ),
      size: 140,
    },
    {
      id: 'createdBy',
      header: 'User Hoàn / Lý do',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.createdBy ?? '—'}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.reason ?? '—'}</p>
        </div>
      ),
      size: 180,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const opt = REFUND_STATUS_OPTIONS.find((o) => o.value === row.original.status);
        return <Badge className="min-w-24 justify-center" variant={opt?.variant ?? 'outline'}>{opt?.label ?? row.original.status}</Badge>;
      },
      size: 130,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => <RowActions refund={row.original} actions={actions} />,
      size: 100,
    },
  ];
}
