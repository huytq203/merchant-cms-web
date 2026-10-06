'use client';

import { Table } from '@/components/ui/table/Table';
import type { PermissionGroup } from '../schemas/permission-group.schema';
import { buildPermissionColumns } from '../columns/Permission.column';

interface Props {
  rows: PermissionGroup[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

export function PermissionTable({ rows, total, page, pageSize, onPageChange, onView, onEdit, onDelete }: Props) {
  const columns = buildPermissionColumns({ onView, onEdit, onDelete });
  return (
    <Table
      data={rows}
      columns={columns}
      enableSorting={false}
      labels={{ empty: 'Chưa có nhóm quyền', page: 'Trang', perPage: ' / trang' }}
      pagination={{
        total,
        current: page,
        pageSize,
        pageSizeOptions: [10, 20, 50],
        showTotal: (count) => `${count} nhóm quyền`,
        onChange: onPageChange,
      }}
    />
  );
}
