'use client';
import { useCallback, useMemo, useState } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getComplaintColumns } from '../columns/Complaint.column';
import { ComplaintDetail } from './ComplaintDetail';
import type { Complaint } from '../types/types';

interface ComplaintTableProps {
  data: Complaint[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function ComplaintTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: ComplaintTableProps) {
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleViewDetail = useCallback((complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Complaint>[]>(
    () => getComplaintColumns(handleViewDetail),
    [handleViewDetail],
  );

  return (
    <>
      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        labels={{ empty: 'Không tìm thấy khiếu nại nào phù hợp' }}
        pagination={
          total !== undefined
            ? { total, current: page, pageSize, pageSizeOptions: [10, 20, 50], onChange: onPageChange }
            : false
        }
      />
      <ComplaintDetail
        complaint={selectedComplaint}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
