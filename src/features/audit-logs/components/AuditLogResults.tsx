'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/Button';
import { auditLogQueries } from '../audit-log-queries';
import type { AuditFilter, AuditLog } from '../types';
import { AuditLogResultsSkeleton } from './AuditLogResultsSkeleton';
import { AuditLogTable } from './AuditLogTable';

interface Props {
  filter: AuditFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: AuditLog) => void;
}

export function AuditLogResults({ filter, onPageChange, onView }: Props) {
  const list = useQuery(auditLogQueries.list(filter));

  return (
    <section className="rounded-xl border bg-card p-4" aria-label="Danh sách nhật ký">
      <h2 className="mb-3 font-semibold">Nhật ký {list.data ? `(${list.data.total})` : ''}</h2>
      {list.isPending && <AuditLogResultsSkeleton />}
      {list.isError && (
        <div role="alert" className="space-y-2">
          <p>{list.error.message}</p>
          <Button type="button" variant="outline" onClick={() => void list.refetch()}>Thử lại</Button>
        </div>
      )}
      {list.data?.rows.length === 0 && <p>Không có nhật ký trong khoảng thời gian này</p>}
      {list.data && list.data.rows.length > 0 && (
        <AuditLogTable
          rows={list.data.rows}
          total={list.data.total}
          page={filter.page}
          pageSize={filter.pageSize}
          onPageChange={onPageChange}
          onView={onView}
        />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Ghi nhận toàn bộ thao tác nhạy cảm của mọi người dùng thuộc Merchant.
      </p>
    </section>
  );
}
