import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, RotateCcw } from 'lucide-react';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { cn } from '@/lib/utils/cn';
import { formatAmount, maskPhone } from '@/lib/utils/helper';
import { CARD_TYPE_LABELS, PAYMENT_METHOD_OPTIONS, TRANSACTION_TYPE_OPTIONS } from '../constants/Transaction.constants';
import { TransactionStatusBadge } from '../components/TransactionStatusBadge';
import type { Transaction } from '../types';

export type TransactionColumnActions = {
  canRefund: boolean;
  onViewDetail: (transaction: Transaction) => void;
  onRefund: (transaction: Transaction) => void;
};

function Slot() {
  return <span className="inline-block h-8 w-8" aria-hidden="true" />;
}

function RowActions({ transaction, actions }: { transaction: Transaction; actions: TransactionColumnActions }) {
  const showRefund = actions.canRefund && transaction.status === 'success';
  return (
    <div className="flex items-center justify-center gap-1">
      {showRefund ? (
        <RowAction label={`Hoàn tiền giao dịch ${transaction.code}`} onClick={() => actions.onRefund(transaction)}>
          <RotateCcw size={16} />
        </RowAction>
      ) : (
        <Slot />
      )}
      <RowAction label={`Xem chi tiết giao dịch ${transaction.code}`} onClick={() => actions.onViewDetail(transaction)}>
        <Eye size={16} />
      </RowAction>
    </div>
  );
}

const labelOf = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

const lastFour = (cardNumber: string) => cardNumber.match(/(\d{4})\D*$/)?.[1];

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
          {row.original.code}
        </button>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">{row.original.invoiceCode ?? '—'}</span> · {labelOf(TRANSACTION_TYPE_OPTIONS, row.original.type)}
        </p>
      </div>
    ),
    size: 190,
  },
  {
    id: 'method',
    header: 'Phương thức',
    cell: ({ row }) => {
      const { cardType, cardNumber, paymentMethod, bankCode } = row.original;
      const last = paymentMethod === 'qr' ? undefined : lastFour(cardNumber);
      return (
        <div className="whitespace-nowrap">
          <p className="text-sm text-foreground">
            {paymentMethod === 'qr' ? 'QR Code' : CARD_TYPE_LABELS[cardType]}
            {last ? <span className="font-mono"> •••• {last}</span> : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {labelOf(PAYMENT_METHOD_OPTIONS, paymentMethod)} · {bankCode}
          </p>
        </div>
      );
    },
    size: 180,
  },
  {
    id: 'customer',
    header: 'Khách hàng',
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <p className="text-sm font-medium">{row.original.customerName}</p>
        <p className="font-mono text-xs text-muted-foreground">{maskPhone(row.original.customerPhone)}</p>
      </div>
    ),
    size: 150,
  },
  {
    id: 'subMerchant',
    header: 'Sub-merchant',
    cell: ({ row }) => <span className="block min-w-[110px] text-sm">{row.original.subMerchantName}</span>,
    size: 150,
  },
  {
    id: 'amount',
    header: 'Số tiền',
    meta: { align: 'right' },
    cell: ({ row }) => {
      const { status, amount, fee, netAmount } = row.original;
      return (
        <div className="whitespace-nowrap text-right">
          <p className={cn('font-mono text-sm font-semibold tabular-nums', status === 'failed' ? 'text-muted-foreground line-through' : 'text-foreground')}>
            {formatAmount(amount)}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{fee > 0 ? `Thực nhận ${formatAmount(netAmount)}` : '—'}</p>
        </div>
      );
    },
    size: 170,
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
    cell: ({ row }) => <TransactionStatusBadge status={row.original.status} />,
    size: 120,
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
