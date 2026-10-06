'use client';

import { Button } from '@/components/ui/button/Button';
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

const entityOptions = [{ value: '', label: 'Tất cả' }, ...auditEntityOptions];

export function AuditLogFilters({ filter, onSearch, onClear }: Props) {
  const form = useAuditFilterForm(filter, onSearch);

  return (
    <form onSubmit={form.submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Người thực hiện"
          value={form.actorUsername}
          onChange={(event) => form.setActorUsername(event.target.value)}
          placeholder="Tên đăng nhập người dùng merchant"
        />
        <Select
          label="Phân hệ"
          placeholder="Chọn phân hệ"
          value={form.entityName}
          onChange={form.setEntityName}
          options={entityOptions}
          clearable={false}
        />
        <Input
          label="Từ ngày"
          type="date"
          value={form.occurredFromDate}
          onChange={(event) => form.setOccurredFromDate(event.target.value)}
        />
        <Input
          label="Đến ngày"
          type="date"
          value={form.occurredToDate}
          onChange={(event) => form.setOccurredToDate(event.target.value)}
        />
      </div>
      {form.error && <p role="alert" className="text-sm text-danger">{form.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClear}>Xóa lọc</Button>
        <Button type="submit" variant="solid">Tìm kiếm</Button>
      </div>
    </form>
  );
}
