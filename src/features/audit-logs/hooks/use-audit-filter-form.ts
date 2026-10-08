import { useState } from 'react';
import { auditFilterSchema } from '../schemas';
import type { AuditFilter } from '../types';

export function useAuditFilterForm(filter: AuditFilter, onSearch: (filter: AuditFilter) => void) {
  const [actorUsername, setActorUsername] = useState(filter.actorUsername ?? '');
  const [entityName, setEntityName] = useState(filter.entityName ?? '');
  const [occurredFromDate, setOccurredFromDate] = useState(filter.occurredFrom?.slice(0, 10) ?? '');
  const [occurredToDate, setOccurredToDate] = useState(filter.occurredTo?.slice(0, 10) ?? '');
  const [error, setError] = useState('');

  const submit = () => {
    const parsed = auditFilterSchema.safeParse({
      ...filter,
      page: 1,
      actorUsername: actorUsername.trim() || undefined,
      entityName: entityName || undefined,
      occurredFrom: occurredFromDate ? `${occurredFromDate}T00:00:00` : undefined,
      occurredTo: occurredToDate ? `${occurredToDate}T23:59:59` : undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Bộ lọc không hợp lệ');
      return;
    }
    setError('');
    onSearch(parsed.data);
  };

  return {
    actorUsername,
    entityName,
    occurredFromDate,
    occurredToDate,
    error,
    setActorUsername,
    setEntityName,
    setOccurredFromDate,
    setOccurredToDate,
    submit,
  };
}
