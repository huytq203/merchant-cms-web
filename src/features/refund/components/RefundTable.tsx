'use client';
import { Table } from '@/components/ui';
import { getRefundColumns, type RefundColumnActions } from '../columns/Refund.column';
import type { Refund } from '../types/type';

type RefundTableProps = RefundColumnActions & {
  rows: Refund[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

export function RefundTable(props: RefundTableProps) {
  const { rows, total, page, pageSize, onPageChange, ...actions } = props;
  return (
    <Table
      data={rows}
      columns={getRefundColumns(actions)}
      labels={{ empty: 'Không tìm thấy yêu cầu hoàn tiền nào phù hợp' }}
      pagination={{ total, current: page, pageSize, pageSizeOptions: [10, 20, 50, 100], onChange: onPageChange }}
    />
  );
}
