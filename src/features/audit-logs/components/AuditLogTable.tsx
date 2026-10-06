'use client';

import { Table } from '@/components/ui/table/Table';
import type { AuditLog } from '../types';
import { auditLogColumns } from '../columns/AuditLogColumn';

interface Props {
  rows: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: AuditLog) => void;
}

export function AuditLogTable({ rows, total, page, pageSize, onPageChange, onView }: Props) {
  return (
    <div className="max-w-full overflow-x-auto">
      <Table
        data={rows}
        columns={auditLogColumns(onView)}
        labels={{ empty: 'Không có nhật ký' }}
        pagination={{ total, current: page, pageSize, onChange: onPageChange }}
      />
    </div>
  );
}
