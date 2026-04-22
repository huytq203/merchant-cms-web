'use client';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { getColumn } from '../columns/TransactionColumn';
import { TransactionDetailSheet } from './TransactionDetailSheet';
import type { Transaction } from '../types';
import { toast } from 'sonner';

interface TransactionTableProps {
  data: Transaction[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function TransactionTable({
  data,
  isLoading,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
}: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleRefund = (transaction: Transaction) => {
    toast.info(`Đang xử lý hoàn tiền giao dịch ${transaction.code}...`);
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => getColumn(setSelectedTransaction, handleRefund),
    [],
  );

  return (
    <>
      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        labels={{ empty: 'Không tìm thấy giao dịch nào phù hợp' }}
        pagination={
          total !== undefined
            ? {
                total,
                current: page,
                pageSize,
                pageSizeOptions: [20, 50, 100],
                onChange: onPageChange,
              }
            : false
        }
      />

      <TransactionDetailSheet
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      />
    </>
  );
}
