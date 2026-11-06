import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, RotateCcw } from 'lucide-react';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { cn } from '@/lib/utils/cn';
import { formatAmount } from '@/lib/utils/helper';
import { BANK_OPTIONS, PAYMENT_METHOD_OPTIONS, optionLabel } from '../constants/Transaction.constants';
import { TransactionStatusBadge } from '../components/TransactionStatusBadge';
import type { Transaction } from '../types';

export type TransactionColumnActions = {
  canRefund: boolean;
  onViewDetail: (transaction: Transaction) => void;
  onRefund: (transaction: Transaction) => void;
};

/** The code shown for a row: its transaction code, or the order code for an order created without one. */
export const displayCode = (transaction: Transaction): string => transaction.transactionCode ?? transaction.orderCode;

function Slot() {
  return <span className="inline-block h-8 w-8" aria-hidden="true" />;
}

function RowActions({ transaction, actions }: { transaction: Transaction; actions: TransactionColumnActions }) {
  // Only a settled payment can be refunded.
  const showRefund = actions.canRefund && transaction.status === 'SUCCESS';
  const code = displayCode(transaction);
  return (
    <div className="flex items-center justify-center gap-1">
      {showRefund ? (
        <RowAction label={`Hoàn tiền giao dịch ${code}`} onClick={() => actions.onRefund(transaction)}>
          <RotateCcw size={16} />
        </RowAction>
      ) : (
        <Slot />
      )}
      <RowAction label={`Xem chi tiết giao dịch ${code}`} onClick={() => actions.onViewDetail(transaction)}>
        <Eye size={16} />
      </RowAction>
    </div>
  );
}

export const getColumn = (actions: TransactionColumnActions): ColumnDef<Transaction>[] => [
  {
    id: 'code',
    header: 'Mã giao dịch',
    cell: ({ row }) => (
      <div>
        <button
          type="button"
          className="font-mono text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => actions.onViewDetail(row.original)}
        >
          {displayCode(row.original)}
        </button>
        <p className="font-mono text-xs text-muted-foreground">{row.original.orderCode}</p>
      </div>
    ),
    size: 190,
  },
  {
    id: 'method',
    header: 'Phương thức',
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <p className="text-sm text-foreground">{optionLabel(PAYMENT_METHOD_OPTIONS, row.original.paymentMethod)}</p>
        <p className="text-xs text-muted-foreground">{optionLabel(BANK_OPTIONS, row.original.bankCode)}</p>
      </div>
    ),
    size: 170,
  },
  {
    id: 'subMerchant',
    header: 'Sub-merchant',
    cell: ({ row }) => (
      <div className="min-w-[110px]">
        <p className="text-sm">{row.original.subMerchantName ?? '—'}</p>
        <p className="font-mono text-xs text-muted-foreground">{row.original.subMerchantCode ?? ''}</p>
      </div>
    ),
    size: 170,
  },
  {
    id: 'amount',
    header: 'Số tiền',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const { status, amount, feeAmount, netAmount } = row.original;
      return (
        <div className="whitespace-nowrap text-right">
          <p className={cn('font-mono text-sm font-semibold tabular-nums', status === 'FAILED' ? 'text-muted-foreground line-through' : 'text-foreground')}>
            {formatAmount(amount)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {(feeAmount ?? 0) > 0 && netAmount != null ? `Thực nhận ${formatAmount(netAmount)}` : '—'}
          </p>
        </div>
      );
    },
    size: 170,
  },
  {
    id: 'createdAt',
    header: 'Thời gian',
    cell: ({ row }) => {
      // BE sends Vietnam local time without an offset; the portal runs in that zone.
      const created = row.original.createdAt ? new Date(row.original.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) return <span className="text-sm text-muted-foreground">—</span>;
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
    cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
    size: 140,
  },
  {
    id: 'actions',
    header: 'Thao tác',
    meta: { align: 'center' },
    enableSorting: false,
    cell: ({ row }) => <RowActions transaction={row.original} actions={actions} />,
    size: 100,
  },
];
