'use client';
import { Table } from '@/components/ui';
import { getColumn, type TransactionColumnActions } from '../columns/TransactionColumn';
import type { Transaction } from '../types';

type TransactionTableProps = TransactionColumnActions & {
  rows: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

export function TransactionTable(props: TransactionTableProps) {
  const { rows, total, page, pageSize, onPageChange, ...actions } = props;
  return (
    <Table
      data={rows}
      columns={getColumn(actions)}
      labels={{ empty: 'Không tìm thấy giao dịch nào phù hợp' }}
      pagination={{
        total,
        current: page,
        pageSize,
        pageSizeOptions: [10, 20, 50, 100],
        onChange: onPageChange,
      }}
    />
  );
}
