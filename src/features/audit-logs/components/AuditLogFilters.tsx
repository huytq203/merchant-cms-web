'use client';

import { format, parseISO } from 'date-fns';
import { FilterCard } from '@/components/page/FilterCard';
import { SegmentedControl } from '@/components/form/SegmentedControl';
import { DatePicker } from '@/components/ui/datepicker/DatePicker';
import { Select } from '@/components/ui/select/Select';
import { useAuditFilterForm } from '../hooks/use-audit-filter-form';
import type { AuditFilter } from '../types';
import { auditActionOptions, auditActorTypeOptions, auditCategoryOptions, auditPeriodOptions } from '../utils/audit-mapper';

interface Props {
  filter: AuditFilter;
  onSearch: (filter: AuditFilter) => void;
  onClear: () => void;
}

/** Bộ lọc nhật ký: Kỳ (7 ngày mặc định / 30 ngày / Tùy chỉnh), Nhóm, Người thực hiện, Hành động. */
export function AuditLogFilters({ filter, onSearch, onClear }: Props) {
  const form = useAuditFilterForm(filter, onSearch);
  const custom = form.period === 'custom';

  const toDate = (value: string) => value ? parseISO(value) : undefined;
  const toValue = (value: Date | undefined) => value ? format(value, 'yyyy-MM-dd') : '';

  return (
    <FilterCard fieldCount={custom ? 6 : 4} onSubmit={form.submit} onClear={onClear}>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Kỳ</span>
        <SegmentedControl
          options={auditPeriodOptions}
          value={form.period}
          onChange={form.setPeriod}
          ariaLabel="Kỳ"
          fullWidth
        />
      </div>
      <Select
        label="Nhóm"
        placeholder="Tất cả"
        value={form.category}
        onChange={form.setCategory}
        options={auditCategoryOptions}
        clearLabel="Bỏ chọn nhóm"
      />
      <Select
        label="Người thực hiện"
        placeholder="Tất cả (merchant / FlexPay / hệ thống)"
        value={form.actorType}
        onChange={form.setActorType}
        options={auditActorTypeOptions}
        clearLabel="Bỏ chọn người thực hiện"
      />
      <Select
        label="Hành động"
        placeholder="Tất cả"
        value={form.action}
        onChange={form.setAction}
        options={auditActionOptions}
        clearLabel="Bỏ chọn hành động"
      />
      {custom && (
        <DatePicker
          label="Từ ngày"
          value={toDate(form.occurredFromDate)}
          onChange={(value) => form.setOccurredFromDate(toValue(value instanceof Date ? value : undefined))}
          placeholder="Chọn ngày"
          presets={false}
        />
      )}
      {custom && (
        <DatePicker
          label="Đến ngày"
          value={toDate(form.occurredToDate)}
          onChange={(value) => form.setOccurredToDate(toValue(value instanceof Date ? value : undefined))}
          placeholder="Chọn ngày"
          presets={false}
        />
      )}
      {form.error && <p role="alert" className="text-sm text-danger">{form.error}</p>}
    </FilterCard>
  );
}
