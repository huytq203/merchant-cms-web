'use client';

import { ConfirmModal } from '@/components/modal/ConfirmModal';
import type { PermissionGroup } from '../schemas/permission-group.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: PermissionGroup | null;
  isDeleting: boolean;
  error?: string;
  onConfirm: () => void;
}

export function PermissionGroupDeleteDialog({ open, onOpenChange, group, isDeleting, error, onConfirm }: Props) {
  return (
    <ConfirmModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Xóa nhóm ${group?.name ?? ''}?`}
      description="Nhóm đang có người dùng sẽ không thể xóa. Hành động này không thể hoàn tác."
      confirmLabel="Xóa nhóm"
      cancelLabel="Hủy"
      isLoading={isDeleting}
      onConfirm={onConfirm}
    >
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </ConfirmModal>
  );
}
