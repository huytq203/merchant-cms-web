import { Badge } from '@/components/ui/badge/Badge';
import { cn } from '@/lib/utils/cn';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, RotateCcw } from 'lucide-react';
import { CARD_TYPE_LABELS, TRANSACTION_STATUS_OPTIONS } from '../constants/Transaction.constants';
import type { Transaction } from '../types';
import { formatAmount, formatDate, maskPhone } from '@/lib/utils/helper';
import { Button } from '@/components/ui';


export const getColumn = (
  onViewDetail: (transaction: Transaction) => void,
  onRefund: (transaction: Transaction) => void,
): ColumnDef<Transaction>[] => [
  {
    id: 'code',
    header: 'Mã giao dịch',
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-primary text-sm">
        {row.original.code}
      </span>
    ),
    size: 150,
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
          <p className="font-mono text-sm text-foreground">{t.cardNumber}</p>
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
        <Badge variant={option?.variant ?? 'outline'}>
          {option?.label ?? row.original.status}
        </Badge>
      );
    },
    size: 120,
  },
  {
    id: 'actions',
    header: '',
    meta: { align: 'center' },
    enableSorting: false,
    cell: ({ row }) => {
      const t = row.original;
      const canRefund = t.status === 'success';
      return (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={!canRefund}
            onClick={() => onRefund(t)}
            title="Hoàn tiền"
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors border',
              canRefund
                ? 'border-warning/60 text-warning hover:bg-warning/10'
                : 'border-transparent text-muted-foreground opacity-40 cursor-not-allowed',
            )}
          >
            <RotateCcw className="h-3 w-3" />
            Hoàn tiền
          </button>
          <Button
            onClick={() => onViewDetail(t)}
            title="Xem chi tiết"
            variant="outline"
            size="sm"
            leftIcon={<Eye className="h-3 w-3" />}
            className='rounded-md'
          >
            Chi tiết
          </Button>
        </div>
      );
    },
    size: 160,
  },
];
