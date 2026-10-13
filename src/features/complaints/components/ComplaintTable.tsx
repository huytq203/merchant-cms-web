'use client';
import { useState } from 'react';
import { Table } from '@/components/ui';
import { getComplaintColumns } from '../columns/Complaint.column';
import type { Complaint } from '../types/types';

interface ComplaintTableProps {
  rows: Complaint[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (complaint: Complaint) => void;
}

export function ComplaintTable({ rows, total, page, pageSize, onPageChange, onViewDetail }: ComplaintTableProps) {
  // Read once per mount: deadlines are counted in hours or days, so a fixed reading is enough for the table.
  const [now] = useState(() => new Date());
  return (
    <Table
      data={rows}
      columns={getComplaintColumns(onViewDetail, now)}
      labels={{ empty: 'Không tìm thấy khiếu nại nào phù hợp' }}
      pagination={{ total, current: page, pageSize, pageSizeOptions: [10, 20, 50, 100], onChange: onPageChange }}
    />
  );
}
