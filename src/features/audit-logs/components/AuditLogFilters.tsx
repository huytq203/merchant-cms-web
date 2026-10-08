'use client';

import { format, parseISO } from 'date-fns';
import { FilterCard } from '@/components/page/FilterCard';
import { DatePicker } from '@/components/ui/datepicker/DatePicker';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { useAuditFilterForm } from '../hooks/use-audit-filter-form';
import type { AuditFilter } from '../types';
import { auditEntityOptions } from '../utils/audit-mapper';

interface Props {
  filter: AuditFilter;
  onSearch: (filter: AuditFilter) => void;
  onClear: () => void;
}

const entityOptions = auditEntityOptions;

export function AuditLogFilters({ filter, onSearch, onClear }: Props) {
  const form = useAuditFilterForm(filter, onSearch);

  const toDate = (value: string) => value ? parseISO(value) : undefined;
  const toValue = (value: Date | undefined) => value ? format(value, 'yyyy-MM-dd') : '';

  return (
    <FilterCard fieldCount={4} onSubmit={form.submit} onClear={onClear}>
        <Input
          label="Người thực hiện"
          value={form.actorUsername}
          onChange={(event) => form.setActorUsername(event.target.value)}
          placeholder="Tên đăng nhập người dùng merchant"
        />
        <Select
          label="Phân hệ"
          placeholder="Tất cả phân hệ"
          value={form.entityName}
          onChange={form.setEntityName}
          options={entityOptions}
          clearable={false}
        />
        <DatePicker
          label="Từ ngày"
          value={toDate(form.occurredFromDate)}
          onChange={(value) => form.setOccurredFromDate(toValue(value instanceof Date ? value : undefined))}
          placeholder="Chọn ngày"
          presets={false}
        />
        <DatePicker
          label="Đến ngày"
          value={toDate(form.occurredToDate)}
          onChange={(value) => form.setOccurredToDate(toValue(value instanceof Date ? value : undefined))}
          placeholder="Chọn ngày"
          presets={false}
        />
      {form.error && <p role="alert" className="text-sm text-danger">{form.error}</p>}
    </FilterCard>
  );
}
