import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge/Badge';
import { createIndexColumn } from '@/components/page/IndexColumn';
import { StatusBadge } from '@/components/page/StatusBadge';
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

export function getColumn(handlers: SubMerchantRowHandlers, page: number, pageSize: number): ColumnDef<SubMerchantRow>[] {
  return [
    createIndexColumn<SubMerchantRow>({ page, pageSize }),
    { accessorKey: 'code', header: 'Mã' },
    { accessorKey: 'name', header: 'Tên' },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => statusBadge(row.original),
    },
    {
      id: 'isDefault',
      header: 'Mặc định',
      cell: ({ row }) => row.original.isDefault ? <Badge variant="secondary">Mặc định</Badge> : null,
    },
    {
      id: 'actions',
      header: () => <span className="w-px whitespace-nowrap">Thao tác</span>,
      enableSorting: false,
      cell: ({ row }) => <SubMerchantRowActions item={row.original} {...handlers} />,
    },
  ];
}
