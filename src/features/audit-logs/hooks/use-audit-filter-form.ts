import { useState } from 'react';
import { presetRange } from '../audit-log-queries';
import { auditFilterSchema } from '../schemas';
import type { AuditFilter, AuditPeriod } from '../types';

/**
 * Trạng thái form lọc. Chọn kỳ 7/30 ngày áp dụng ngay (một chạm, như các màn thống kê khác); "Tùy chỉnh" chỉ mở hai
 * ô ngày, áp dụng khi bấm Tìm kiếm cùng các lọc còn lại.
 */
export function useAuditFilterForm(filter: AuditFilter, onSearch: (filter: AuditFilter) => void) {
  const [period, setPeriodState] = useState<AuditPeriod>(filter.period ?? 'custom');
  const [category, setCategory] = useState<string>(filter.category ?? '');
  const [actorType, setActorType] = useState<string>(filter.actorType ?? '');
  const [action, setAction] = useState<string>(filter.action ?? '');
  const [occurredFromDate, setOccurredFromDate] = useState(filter.occurredFrom?.slice(0, 10) ?? '');
  const [occurredToDate, setOccurredToDate] = useState(filter.occurredTo?.slice(0, 10) ?? '');
  const [error, setError] = useState('');

  const build = (chosen: AuditPeriod) => {
    const range = chosen === 'custom'
      ? {
          occurredFrom: occurredFromDate ? `${occurredFromDate}T00:00:00` : undefined,
          occurredTo: occurredToDate ? `${occurredToDate}T23:59:59` : undefined,
        }
      : presetRange(chosen);
    return auditFilterSchema.safeParse({
      ...filter,
      page: 1,
      period: chosen,
      category: category || undefined,
      actorType: actorType || undefined,
      action: action || undefined,
      ...range,
    });
  };

  const apply = (chosen: AuditPeriod) => {
    const parsed = build(chosen);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Bộ lọc không hợp lệ');
      return;
    }
    setError('');
    onSearch(parsed.data);
  };

  const setPeriod = (next: AuditPeriod) => {
    setPeriodState(next);
    if (next !== 'custom') apply(next);
  };

  return {
    period,
    category,
    actorType,
    action,
    occurredFromDate,
    occurredToDate,
    error,
    setPeriod,
    setCategory,
    setActorType,
    setAction,
    setOccurredFromDate,
    setOccurredToDate,
    submit: () => apply(period),
  };
}
