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

/** Trạng thái TK theo SRS v2: Chờ xác minh (vẫn rút được) / Đã xác minh; TK Khóa hiện badge riêng bên dưới. */
const accountStatusLabels = {
  PENDING_VERIFICATION: { label: 'Chờ xác minh', tone: 'warning' },
  VERIFIED: { label: 'Đã xác minh', tone: 'success' },
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
  if (!account) return <span className="text-muted-foreground">Chưa gán TK</span>;
  // FR-MER-0607-08: TK đang gán bị khóa thì báo đỏ để merchant biết Sub không rút được.
  const locked = account.locked === true || account.accountStatus === 'LOCKED';
  const status = account.accountStatus && account.accountStatus !== 'LOCKED' ? accountStatusLabels[account.accountStatus] : null;
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="tabular-nums">{[account.bankCode, account.maskedAccountNo].filter(Boolean).join(' ')}</span>
      {locked ? <StatusBadge label="Tài khoản rút tiền bị khóa" tone="danger" /> : null}
      {!locked && status ? <StatusBadge label={status.label} tone={status.tone} /> : null}
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
