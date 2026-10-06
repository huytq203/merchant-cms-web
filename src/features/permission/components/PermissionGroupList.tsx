'use client';

import { Button } from '@/components/ui/button/Button';
import { usePermissionGroups, type PermissionGroupFilter } from '../permission-group-queries';
import type { PermissionGroup } from '../schemas/permission-group.schema';
import { PermissionGroupListSkeleton } from './PermissionGroupListSkeleton';
import { PermissionTable } from './PermissionTable';

interface Props {
  filter: PermissionGroupFilter;
  onPageChange: (page: number, pageSize: number) => void;
  onView: (group: PermissionGroup) => void;
  onEdit: (group: PermissionGroup) => void;
  onDelete: (group: PermissionGroup) => void;
}

export function PermissionGroupList({ filter, onPageChange, onView, onEdit, onDelete }: Props) {
  const list = usePermissionGroups(filter);

  if (list.isPending) return <PermissionGroupListSkeleton />;
  if (list.isError) {
    return (
      <div>
        <p role="alert">{list.error.message}</p>
        <Button type="button" variant="outline" onClick={() => void list.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (list.data.rows.length === 0) {
    return (
      <p role="status" className="py-12 text-center text-muted-foreground">
        Chưa có nhóm quyền
      </p>
    );
  }
  return (
    <PermissionTable
      rows={list.data.rows}
      total={list.data.total}
      page={filter.page}
      pageSize={filter.pageSize}
      onPageChange={onPageChange}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
