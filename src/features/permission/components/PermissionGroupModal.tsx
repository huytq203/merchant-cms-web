'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog/Dialog';
import type { PermissionCatalogItem, PermissionGroup, PermissionGroupFormValues } from '../schemas/permission-group.schema';
import { PermissionForm } from './PermissionForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: PermissionCatalogItem[];
  group?: PermissionGroup | null;
  isSubmitting: boolean;
  error?: string;
  onSubmit: (values: PermissionGroupFormValues) => void;
}

export function PermissionGroupModal({ open, onOpenChange, catalog, group, isSubmitting, error, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{group ? 'Cập nhật nhóm quyền' : 'Thêm nhóm quyền'}</DialogTitle>
        </DialogHeader>
        <PermissionForm
          key={group?.id ?? 'create'}
          catalog={catalog}
          group={group}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
