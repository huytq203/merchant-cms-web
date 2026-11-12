import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge/Badge';
import { createIndexColumn } from '@/components/page/IndexColumn';
import { StatusBadge } from '@/components/page/StatusBadge';
import { formatAmount } from '@/lib/utils/helper';
import { formatBusinessCategory } from '@/features/business-categories/utils';
import {
  SubMerchantRowActions,
  type SubMerchantRowHandlers,
} from '../components/SubMerchantRowActions';
import type { SubMerchantRow } from '../types';

export function statusBadge(row: Pick<SubMerchantRow, 'status' | 'lockSource'>) {
  if (row.status === 'ACTIVE') return <StatusBadge label="Đang hoạt động" tone="success" />;
  if (row.status === 'TERMINATED') return <Badge variant="outline">Đã đóng</Badge>;
  if (row.lockSource === 'CASCADE') return <StatusBadge label="Khóa theo Master" tone="warning" />;
  return <StatusBadge label="Đã khóa" tone="neutral" />;
}

const linkLabels = {
  LINKED: { label: 'Đã liên kết', tone: 'success' },
  PENDING_VERIFICATION: { label: 'Chờ xác minh', tone: 'warning' },
  LINK_FAILED: { label: 'Liên kết thất bại', tone: 'danger' },
} as const;

/** "2 · 1 QR · 1 POS": the total first, then only the types that exist, in a fixed order. */
export function terminalBreakdown(row: Pick<SubMerchantRow, 'terminalCount' | 'terminalCountByType'>): string {
  const byType = row.terminalCountByType ?? {};
  const parts = (['QR', 'POS', 'ONLINE'] as const)
    .filter((type) => (byType[type] ?? 0) > 0)
    .map((type) => `${byType[type]} ${type === 'ONLINE' ? 'Online' : type}`);
  return parts.join(' · ');
}

function BankAccountCell({ account }: { account: SubMerchantRow['settlementBankAccount'] }) {
  if (!account) return <span className="text-muted-foreground">Chưa có TK</span>;
  const link = linkLabels[account.linkStatus];
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="tabular-nums">{[account.bankCode, account.maskedAccountNo].filter(Boolean).join(' ')}</span>
      <StatusBadge label={link.label} tone={link.tone} />
      {account.isDefault === false ? <StatusBadge label="Chưa đặt TK mặc định" tone="warning" /> : null}
    </div>
  );
}

export function getColumn(handlers: SubMerchantRowHandlers, page: number, pageSize: number): ColumnDef<SubMerchantRow>[] {
  return [
    createIndexColumn<SubMerchantRow>({ page, pageSize }),
    {
      id: 'sub',
      header: 'Mã · Tên',
      cell: ({ row }) => (
        <div className="flex flex-col items-start gap-0.5">
          <span className="font-medium">
            {row.original.name}
            {row.original.isDefault ? <Badge variant="secondary" className="ml-2">Mặc định</Badge> : null}
          </span>
          <span className="text-xs text-muted-foreground">{row.original.code}</span>
        </div>
      ),
    },
    {
      id: 'businessField',
      header: 'Ngành nghề',
      cell: ({ row }) => formatBusinessCategory(row.original.businessField, row.original.mccCode) || <span className="text-muted-foreground">—</span>,
    },
    {
      id: 'terminals',
      header: 'Terminal',
      cell: ({ row }) => {
        const count = row.original.terminalCount ?? 0;
        const breakdown = terminalBreakdown(row.original);
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="tabular-nums font-medium">{count}</span>
            {breakdown ? <span className="text-xs text-muted-foreground">{breakdown}</span> : null}
          </div>
        );
      },
    },
    {
      id: 'bankAccount',
      header: 'TK nhận tiền',
      cell: ({ row }) => <BankAccountCell account={row.original.settlementBankAccount} />,
    },
    {
      id: 'revenue7d',
      header: 'Doanh thu 7 ngày',
      meta: { align: 'right' },
      cell: ({ row }) => <span className="tabular-nums">{formatAmount(row.original.revenue7d ?? 0)}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => statusBadge(row.original),
    },
    {
      id: 'createdAt',
      header: 'Ngày tạo',
      cell: ({ row }) => {
        const value = row.original.createdAt;
        const date = value ? new Date(value) : null;
        return date && !Number.isNaN(date.getTime())
          ? <span className="tabular-nums">{format(date, 'dd/MM/yyyy')}</span>
          : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: 'actions',
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <SubMerchantRowActions item={row.original} {...handlers} />,
    },
  ];
}
