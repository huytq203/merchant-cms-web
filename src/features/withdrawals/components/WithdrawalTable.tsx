'use client';
import { useCallback, useMemo, useState } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getWithdrawalColumns } from '../columns/Withdrawal.column';
import { WithdrawalDetail } from './WithdrawalDetail';
import type { Withdrawal } from '../types/types';

interface WithdrawalTableProps {
  data: Withdrawal[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function WithdrawalTable({
  data,
  isLoading,
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
}: WithdrawalTableProps) {
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewDetail = useCallback((withdrawal: Withdrawal) => {
    setSelected(withdrawal);
    setDetailOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Withdrawal>[]>(
    () => getWithdrawalColumns(handleViewDetail),
    [handleViewDetail],
  );

  return (
    <>
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
      <WithdrawalDetail
        withdrawal={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
