'use client';

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog/AlertDialog';
import { Button } from '@/components/ui/button/Button';
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoá nhóm quyền</AlertDialogTitle>
          <AlertDialogDescription>
            Xoá nhóm {group?.name}? Nhóm đang có người dùng sẽ không thể xoá.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <AlertDialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button type="button" variant="danger" disabled={isDeleting} onClick={onConfirm}>Xác nhận xoá</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
