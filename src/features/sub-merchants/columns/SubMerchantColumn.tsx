import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge/Badge';
import {
  SubMerchantRowActions,
  type SubMerchantRowHandlers,
} from '../components/SubMerchantRowActions';
import type { SubMerchantRow } from '../types';

export function statusBadge(row: Pick<SubMerchantRow, 'status' | 'lockSource'>) {
  if (row.status === 'ACTIVE') return <Badge variant="soft-success">Đang hoạt động</Badge>;
  if (row.status === 'TERMINATED') return <Badge variant="outline">Đã đóng</Badge>;
  if (row.lockSource === 'CASCADE') return <Badge variant="soft-warning">Khóa theo Master</Badge>;
  return <Badge variant="secondary">Đã khóa</Badge>;
}

export function getColumn(handlers: SubMerchantRowHandlers): ColumnDef<SubMerchantRow>[] {
  return [
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
      header: 'Thao tác',
      enableSorting: false,
      cell: ({ row }) => <SubMerchantRowActions item={row.original} {...handlers} />,
    },
  ];
}
