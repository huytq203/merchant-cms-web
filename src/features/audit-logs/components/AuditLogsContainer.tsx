'use client';

import { useState } from 'react';
import { useAuditLogNavigation } from '../hooks/use-audit-log-navigation';
import type { AuditFilter, AuditLog } from '../types';
import { AuditLogDetailModal } from './AuditLogDetailModal';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogResults } from './AuditLogResults';

interface Props {
  filter: AuditFilter;
}

function filterKey(filter: AuditFilter): string {
  return [filter.actorUsername, filter.entityName, filter.occurredFrom, filter.occurredTo].join('|');
}

export function AuditLogsContainer({ filter }: Props) {
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const navigation = useAuditLogNavigation(filter);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Nhật ký hệ thống (Audit Log)</h1>
      </header>
      <section className="rounded-xl border bg-card p-4" aria-label="Bộ lọc nhật ký">
        <AuditLogFilters
          key={filterKey(filter)}
          filter={filter}
          onSearch={navigation.search}
          onClear={navigation.clear}
        />
      </section>
      <AuditLogResults filter={filter} onPageChange={navigation.changePage} onView={setSelected} />
      <AuditLogDetailModal row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
