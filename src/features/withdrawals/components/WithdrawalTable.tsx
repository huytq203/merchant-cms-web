'use client';
import { useMemo } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getWithdrawalColumns } from '../columns/Withdrawal.column';
import type { Withdrawal } from '../types';

interface WithdrawalTableProps {
  data: Withdrawal[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function WithdrawalTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: WithdrawalTableProps) {
  const columns = useMemo<ColumnDef<Withdrawal>[]>(() => getWithdrawalColumns(), []);

  return (
    <Table
      data={data}
      columns={columns}
      isLoading={isLoading}
      labels={{ empty: 'Không tìm thấy yêu cầu rút tiền nào phù hợp' }}
      pagination={
        total !== undefined
          ? { total, current: page, pageSize, pageSizeOptions: [10, 20, 50], onChange: onPageChange }
          : false
      }
    />
  );
}
