'use client';
import { Badge } from '@/components/ui/badge/Badge';
import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatAmount, formatDate } from '@/lib/utils/helper';
import { REFUND_STATUS_OPTIONS } from '../constants/Refund.constants';
import type { Refund } from '../types/type';

export function getRefundColumns(
  onViewDetail: (refund: Refund) => void,
  onCancelRefund: (refund: Refund) => void,
): ColumnDef<Refund>[] {
  return [
    {
      id: 'index',
      header: 'STT',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.index + 1}</span>
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
      header: 'Mã Giao dịch',
      cell: ({ row }) => (
        <span className="font-mono text-sm text-foreground">{row.original.transactionCode}</span>
      ),
      size: 150,
    },
    {
      id: 'invoiceCode',
      header: 'Mã Hóa đơn',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.invoiceCode ?? '—'}</span>
      ),
      size: 130,
    },
    {
      id: 'subMerchant',
      header: 'Cửa hàng',
      cell: ({ row }) => (
        <span className="text-sm truncate block max-w-[160px]">{row.original.subMerchantName}</span>
      ),
      size: 180,
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
      id: 'feeMb',
      header: 'Phí hoàn (MB)',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.feeMb.toLocaleString('vi-VN')}</span>
      ),
      size: 120,
    },
    {
      id: 'feeNm',
      header: 'Phí hoàn (NM)',
      meta: { align: 'right' },
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.feeNm.toLocaleString('vi-VN')}</span>
      ),
      size: 120,
    },
    {
      id: 'createdAt',
      header: 'Thời gian tạo',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>
      ),
      size: 150,
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
      id: 'recipient',
      header: 'Người nhận',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.recipientName}</p>
          {row.original.recipientCard && (
            <p className="text-xs font-mono text-muted-foreground">{row.original.recipientCard}</p>
          )}
        </div>
      ),
      size: 170,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const opt = REFUND_STATUS_OPTIONS.find((o) => o.value === row.original.status);
        return <Badge variant={opt?.variant ?? 'outline'}>{opt?.label ?? row.original.status}</Badge>;
      },
      size: 130,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      meta: { align: 'center' },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon-sm" title="Xem chi tiết" onClick={() => onViewDetail(row.original)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" title="Xoá" className="text-danger hover:text-danger hover:bg-danger/10" onClick={() => onCancelRefund(row.original)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
      size: 80,
    },
  ];
}
