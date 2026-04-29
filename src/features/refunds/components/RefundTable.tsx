'use client';
import { useMemo } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getRefundColumns } from '../columns/Refund.column';
import type { Refund } from '../types';

interface RefundTableProps {
  data: Refund[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function RefundTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: RefundTableProps) {
  const columns = useMemo<ColumnDef<Refund>[]>(() => getRefundColumns(), []);

  return (
    <Table
      data={data}
      columns={columns}
      isLoading={isLoading}
      labels={{ empty: 'Không tìm thấy yêu cầu hoàn tiền nào phù hợp' }}
      pagination={
        total !== undefined
          ? { total, current: page, pageSize, pageSizeOptions: [10, 20, 50], onChange: onPageChange }
          : false
      }
    />
  );
}
