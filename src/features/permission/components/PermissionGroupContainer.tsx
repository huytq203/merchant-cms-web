'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { usePermissionGroupActions } from '../hooks/use-permission-group-actions';
import { usePermissionGroupDialogs } from '../hooks/use-permission-group-dialogs';
import { usePermissionGroupNavigation } from '../hooks/use-permission-group-navigation';
import type { PermissionGroupFilter } from '../permission-group-queries';
import { PermissionGroupDialogs } from './PermissionGroupDialogs';
import { PermissionGroupFilters } from './PermissionGroupFilters';
import { PermissionGroupList } from './PermissionGroupList';

export function PermissionGroupContainer({ filter }: { filter: PermissionGroupFilter }) {
  const dialogs = usePermissionGroupDialogs();
  const actions = usePermissionGroupActions(dialogs);
  const navigation = usePermissionGroupNavigation(filter);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Quản lý nhóm quyền</h1>
        <Button
          type="button"
          variant="solid"
          leftIcon={<Plus size={16} />}
          onClick={dialogs.openCreate}
        >
          Thêm nhóm quyền
        </Button>
      </header>
      <PermissionGroupFilters
        key={`${filter.query ?? ''}:${filter.systemOnly ?? ''}`}
        filter={filter}
        onSearch={navigation.search}
      />
      <section
        className="rounded-xl border border-border bg-background p-4"
        aria-label="Danh sách nhóm quyền"
      >
        <h2 className="mb-4 font-semibold text-foreground">Danh sách nhóm quyền</h2>
        <PermissionGroupList
          filter={filter}
          onPageChange={navigation.changePage}
          onView={(group) => dialogs.openFor('detail', group)}
          onEdit={(group) => dialogs.openFor('edit', group)}
          onDelete={(group) => dialogs.openFor('delete', group)}
        />
      </section>
      <PermissionGroupDialogs dialogs={dialogs} actions={actions} />
    </div>
  );
}
