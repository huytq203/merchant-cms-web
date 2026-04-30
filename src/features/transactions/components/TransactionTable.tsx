'use client';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { getColumn } from '../columns/TransactionColumn';
import { TransactionDetailSheet } from './TransactionDetailSheet';
import type { Transaction } from '../types';
import { toast } from 'sonner';
import { DialogReconciliation } from './DialogReconciliation';
import { DialogRefund } from './DialogRefund';

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
  const [isReconciliationDialog, setIsReconciliationDialog] = useState(false);
  const [isRefundDialog, setIsRefundDialog] = useState(false);
  const [isDetailDialog, setIsDetailDialog] = useState(false);
  const handleRefund = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsRefundDialog(true)
  };

  const handleViewDetail = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailDialog(true)
  }

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => getColumn(handleViewDetail, handleRefund ),
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
        open={isDetailDialog}
        setIsRefundDialog={setIsRefundDialog}
        setIsReconciliationDialog={setIsReconciliationDialog}
        onOpenChange={(open) => {
          if (!open) setIsDetailDialog(false);
        }}
      />
      <DialogReconciliation
        transaction={selectedTransaction}
        open={isReconciliationDialog}
        onOpenChange={(open) => {
          if (!open) setIsReconciliationDialog(false);
        }}
      />
      <DialogRefund
        transaction={selectedTransaction}
        open={isRefundDialog}
        onOpenChange={(open) => {
          if (!open) setIsRefundDialog(false);
        }}
      />
    </>
  );
}
