import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, Trash2 } from 'lucide-react';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { formatAmount } from '@/lib/utils/helper';
import { RefundStatusBadge } from '../components/RefundStatusBadge';
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

export function getRefundColumns(actions: RefundColumnActions): ColumnDef<Refund>[] {
  return [
    {
      id: 'code',
      header: 'Mã hoàn tiền',
      cell: ({ row }) => (
        <div>
          <button
            type="button"
            className="font-mono text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            onClick={() => actions.onViewDetail(row.original)}
          >
            {row.original.code}
          </button>
          <p className="font-mono text-xs text-muted-foreground">{row.original.transactionCode}</p>
        </div>
      ),
      size: 170,
    },
    {
      id: 'invoice',
      header: 'Hóa đơn / Sub-merchant',
      cell: ({ row }) => (
        <div className="min-w-[110px]">
          <p className="font-mono text-sm">{row.original.invoiceCode ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.original.subMerchantName}</p>
        </div>
      ),
      size: 160,
    },
    {
      id: 'recipient',
      header: 'Người nhận',
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <p className="text-sm font-medium">{row.original.recipientName}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.recipientCard ?? '—'}</p>
        </div>
      ),
      size: 160,
    },
    {
      id: 'requestAmount',
      header: 'Số tiền yêu cầu',
      meta: { align: 'right' },
      cell: ({ row }) => {
        const { status, requestAmount, actualAmount } = row.original;
        return (
          <div className="whitespace-nowrap text-right">
            <p className="font-mono text-sm font-semibold tabular-nums">{formatAmount(requestAmount)}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {status === 'rejected' ? 'Không hoàn' : `Nhận ${formatAmount(actualAmount)}`}
            </p>
          </div>
        );
      },
      size: 170,
    },
    {
      id: 'createdBy',
      header: 'Người tạo / Lý do',
      cell: ({ row }) => (
        <div className="max-w-[170px]">
          <p className="text-sm font-medium">{row.original.createdBy ?? '—'}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground" title={row.original.reason ?? undefined}>
            {row.original.reason ?? '—'}
          </p>
        </div>
      ),
      size: 190,
    },
    {
      id: 'createdAt',
      header: 'Thời gian',
      cell: ({ row }) => {
        const created = new Date(row.original.createdAt);
        if (Number.isNaN(created.getTime())) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="whitespace-nowrap">
            <p className="text-sm tabular-nums">{format(created, 'HH:mm')}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{format(created, 'dd/MM/yyyy')}</p>
          </div>
        );
      },
      size: 110,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => <RefundStatusBadge status={row.original.status} />,
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
