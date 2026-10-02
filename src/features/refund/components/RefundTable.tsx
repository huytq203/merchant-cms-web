'use client';
import { useCallback, useMemo, useState } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getRefundColumns } from '../columns/Refund.column';
import { RefundDetail } from './RefundDetail';
import { DialogCancelRefund } from './DialogCancelRefund';
import type { Refund } from '../types/type';

interface RefundTableProps {
  data: Refund[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function RefundTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: RefundTableProps) {
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [cancelRefund, setCancelRefund] = useState<Refund | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleViewDetail = useCallback((refund: Refund) => {
    setSelectedRefund(refund);
    setDetailOpen(true);
  }, []);

  const handleOpenCancel = useCallback((refund: Refund) => {
    setCancelRefund(refund);
    setCancelOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    // TODO: gọi API hủy yêu cầu hoàn tiền với cancelRefund
    setCancelOpen(false);
  }, []);

  const columns = useMemo<ColumnDef<Refund>[]>(
    () => getRefundColumns(handleViewDetail, handleOpenCancel),
    [handleViewDetail, handleOpenCancel],
  );

  return (
    <>
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
      <RefundDetail
        refund={selectedRefund}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <DialogCancelRefund
        refund={cancelRefund}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
