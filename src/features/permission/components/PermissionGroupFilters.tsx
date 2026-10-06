'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import type { PermissionGroupFilter } from '../permission-group-queries';

const scopeOptions = [
  { label: 'Tất cả', value: '' },
  { label: 'Hệ thống', value: 'true' },
  { label: 'Merchant', value: 'false' },
];

function toScope(systemOnly: boolean | undefined): string {
  if (systemOnly === undefined) return '';
  return String(systemOnly);
}

interface Props {
  filter: PermissionGroupFilter;
  onSearch: (query: string, scope: string) => void;
}

export function PermissionGroupFilters({ filter, onSearch }: Props) {
  const [query, setQuery] = useState(filter.query ?? '');
  const [scope, setScope] = useState(toScope(filter.systemOnly));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query, scope);
  };
  const reset = () => {
    setQuery('');
    setScope('');
    onSearch('', '');
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-border bg-background p-4"
      aria-label="Bộ lọc nhóm quyền"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Tên nhóm quyền"
          placeholder="Nhập tên nhóm quyền"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Cấp quản lý"
          placeholder="Chọn cấp quản lý"
          value={scope}
          onChange={setScope}
          options={scopeOptions}
          clearable={false}
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={reset}>
          Xoá lọc
        </Button>
        <Button type="submit" variant="solid">
          Tìm kiếm
        </Button>
      </div>
    </form>
  );
}
