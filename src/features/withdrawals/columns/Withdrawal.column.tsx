'use client';
import { Badge } from '@/components/ui/badge/Badge';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Link } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatAmount, formatDate } from '@/lib/utils/helper';
import { WITHDRAWAL_STATUS_OPTIONS } from '../constants/Withdrawal.constants';
import type { Withdrawal } from '../types/types';

export function getWithdrawalColumns(): ColumnDef<Withdrawal>[] {
  return [
    {
      id: 'index',
      header: 'STT',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {String(row.index + 1).padStart(2, '0')}
        </span>
      ),
      size: 52,
    },
    {
      id: 'code',
      header: 'Mã giao dịch',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground text-sm">{row.original.code}</span>
      ),
      size: 160,
    },
    {
      id: 'subMerchant',
      header: 'Tài khoản (Sub-MCH)',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-primary text-sm">{row.original.subMerchantShort ?? row.original.subMerchantId}</p>
          <p className="text-xs text-muted-foreground">{row.original.subMerchantName}</p>
        </div>
      ),
      size: 180,
    },
    {
      id: 'amount',
      header: 'Số tiền rút',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground text-sm">
          {formatAmount(row.original.amount)}
        </span>
      ),
      size: 140,
    },
    {
      id: 'fee',
      header: 'Phí GD',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono text-sm text-danger">- {formatAmount(row.original.fee)}</span>
      ),
      size: 100,
    },
    {
      id: 'bankInfo',
      header: 'Tài khoản nhận tiền',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold uppercase">{row.original.bankName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {row.original.bankAccount} · {row.original.accountName}
          </p>
        </div>
      ),
      size: 220,
    },
    {
      id: 'requestedAt',
      header: 'Thời gian yêu cầu',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.requestedAt)}
        </span>
      ),
      size: 150,
    },
    {
      id: 'status',
      header: 'Tình trạng',
      cell: ({ row }) => {
        const opt = WITHDRAWAL_STATUS_OPTIONS.find((o) => o.value === row.original.status);
        return <Badge variant={opt?.variant ?? 'outline'}>{opt?.label ?? row.original.status}</Badge>;
      },
      size: 130,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      enableSorting: false,
      cell: () => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Xem chi tiết"><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" title="Copy link"><Link className="h-4 w-4" /></Button>
        </div>
      ),
      size: 80,
    },
  ];
}
