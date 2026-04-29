'use client';
import { useMemo } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getOrderColumns } from '../columns/Order.column';
import type { Order } from '../types';

interface OrderTableProps {
  data: Order[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function OrderTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: OrderTableProps) {
  const columns = useMemo<ColumnDef<Order>[]>(() => getOrderColumns(), []);

  return (
    <Table
      data={data}
      columns={columns}
      isLoading={isLoading}
      labels={{ empty: 'Không tìm thấy đơn hàng nào phù hợp' }}
      pagination={
        total !== undefined
          ? { total, current: page, pageSize, pageSizeOptions: [10, 20, 50], onChange: onPageChange }
          : false
      }
    />
  );
}
