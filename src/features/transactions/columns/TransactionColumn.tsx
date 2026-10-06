import { Badge } from '@/components/ui/badge/Badge';
import { cn } from '@/lib/utils/cn';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, RotateCcw } from 'lucide-react';
import { RowAction } from '@/features/sample-data/components/RowAction';
import { CARD_TYPE_LABELS, TRANSACTION_STATUS_OPTIONS, TRANSACTION_TYPE_OPTIONS } from '../constants/Transaction.constants';
import type { Transaction } from '../types';
import { formatAmount, formatDate, maskPhone } from '@/lib/utils/helper';

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

export const getColumn = (actions: TransactionColumnActions): ColumnDef<Transaction>[] => [
  {
    id: 'code',
    header: 'Mã giao dịch',
    cell: ({ row }) => (
      <div>
        <span className="font-mono font-semibold text-primary text-sm">{row.original.code}</span>
        <p className="font-mono text-xs text-muted-foreground">{row.original.invoiceCode ?? '—'}</p>
      </div>
    ),
    size: 150,
  },
  {
    id: 'type',
    header: 'Loại giao dịch',
    cell: ({ row }) => (
      <Badge variant="soft-primary">
        {TRANSACTION_TYPE_OPTIONS.find((option) => option.value === row.original.type)?.label}
      </Badge>
    ),
    size: 160,
  },
  {
    id: 'card',
    header: 'Thông tin thẻ',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">
            {CARD_TYPE_LABELS[t.cardType]}
          </p>
          <p className="font-mono text-sm text-foreground">{t.cardNumber.replace(/^.*?(\d{4})$/, '**** $1')}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
            {t.cardHolderName}
          </p>
        </div>
      );
    },
    size: 200,
  },
  {
    id: 'amount',
    header: 'Số tiền',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className={cn(
        'font-mono font-semibold text-sm',
        row.original.status === 'failed' ? 'text-muted-foreground line-through' : 'text-foreground',
      )}>
        {formatAmount(row.original.amount)}
      </span>
    ),
    size: 140,
  },
  {
    id: 'subMerchant',
    header: 'Sub-merchant',
    cell: ({ row }) => (
      <span className="text-sm truncate block max-w-[180px]">
        {row.original.subMerchantName}
      </span>
    ),
    size: 200,
  },
  {
    id: 'customer',
    header: 'Khách hàng',
    cell: ({ row }) => {
      const t = row.original;
      return (
        <div>
          <p className="text-sm font-medium">{t.customerName}</p>
          <p className="text-xs font-mono text-muted-foreground">
            {maskPhone(t.customerPhone)}
          </p>
        </div>
      );
    },
    size: 160,
  },
  {
    id: 'createdAt',
    header: 'Thời gian tạo',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.createdAt)}
      </span>
    ),
    size: 140,
  },
  {
    id: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => {
      const option = TRANSACTION_STATUS_OPTIONS.find(
        (o) => o.value === row.original.status,
      );
      return (
        <Badge className="min-w-24 justify-center" variant={option?.variant ?? 'outline'}>
          {option?.label ?? row.original.status}
        </Badge>
      );
    },
    size: 120,
  },
  {
    id: 'actions',
    header: 'Thao tác',
    meta: { align: 'center' },
    enableSorting: false,
    cell: ({ row }) => <RowActions transaction={row.original} actions={actions} />,
    size: 120,
  },
];
