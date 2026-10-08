'use client';

import { Plus } from 'lucide-react';
import { getRouteTitle } from '@/app/(cms)/_layout/constants/route.constants';
import { PageHeader } from '@/components/page/PageHeader';
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
      <PageHeader
        title={getRouteTitle('/permissions')}
        action={
        <Button
          type="button"
          variant="solid"
          leftIcon={<Plus size={16} />}
          onClick={dialogs.openCreate}
        >
          Thêm nhóm quyền
        </Button>
        }
      />
      <PermissionGroupFilters
        key={`${filter.query ?? ''}:${filter.systemOnly ?? ''}`}
        filter={filter}
        onSearch={navigation.search}
      />
      <PermissionGroupList
        filter={filter}
        onPageChange={navigation.changePage}
        onView={(group) => dialogs.openFor('detail', group)}
        onEdit={(group) => dialogs.openFor('edit', group)}
        onDelete={(group) => dialogs.openFor('delete', group)}
      />
      <PermissionGroupDialogs dialogs={dialogs} actions={actions} />
    </div>
  );
}
