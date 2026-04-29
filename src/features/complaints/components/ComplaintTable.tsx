'use client';
import { useMemo } from 'react';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { getComplaintColumns } from '../columns/Complaint.column';
import type { Complaint } from '../types';

interface ComplaintTableProps {
  data: Complaint[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}

export function ComplaintTable({ data, isLoading, total, page = 1, pageSize = 10, onPageChange }: ComplaintTableProps) {
  const columns = useMemo<ColumnDef<Complaint>[]>(() => getComplaintColumns(), []);

  return (
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
  );
}
