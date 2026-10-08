'use client';

import { useState } from 'react';
import { FilterCard } from '@/components/page/FilterCard';
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

  const submit = () => {
    onSearch(query, scope);
  };
  const reset = () => {
    setQuery('');
    setScope('');
    onSearch('', '');
  };

  return (
    <FilterCard fieldCount={2} onSubmit={submit} onClear={reset}>
        <Input
          label="Tên nhóm quyền"
          placeholder="Nhập tên nhóm quyền"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Cấp quản lý"
          placeholder="Tất cả cấp quản lý"
          value={scope}
          onChange={setScope}
          options={scopeOptions}
          clearable={false}
        />
    </FilterCard>
  );
}
