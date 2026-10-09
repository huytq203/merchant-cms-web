'use client';

import { useQuery } from '@tanstack/react-query';
import { ResultCard } from '@/components/page/ResultCard';
import { ResultState } from '@/components/page/ResultState';
import { auditLogQueries } from '../audit-log-queries';
import type { AuditFilter, AuditLog } from '../types';
import { AuditLogTable } from './AuditLogTable';

interface Props {
  filter: AuditFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (row: AuditLog) => void;
}

export function AuditLogResults({ filter, onPageChange, onView }: Props) {
  const list = useQuery(auditLogQueries.list(filter));

  return (
    <ResultCard>
      {list.isPending && <ResultState state="loading" />}
      {list.isError && (
        <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} />
      )}
      {list.data?.rows.length === 0 && <ResultState state="empty" emptyMessage="Không có nhật ký trong khoảng thời gian này." />}
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
    </ResultCard>
  );
}
