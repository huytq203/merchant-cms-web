import { useState } from 'react';
import type { PermissionGroup } from '../schemas/permission-group.schema';

type DialogName = 'create' | 'edit' | 'detail' | 'delete';

export type PermissionGroupDialogs = ReturnType<typeof usePermissionGroupDialogs>;

export function usePermissionGroupDialogs() {
  const [activeDialog, setActiveDialog] = useState<DialogName | null>(null);
  const [target, setTarget] = useState<PermissionGroup | null>(null);

  const openCreate = () => {
    setTarget(null);
    setActiveDialog('create');
  };
  const openFor = (dialog: Exclude<DialogName, 'create'>, group: PermissionGroup) => {
    setTarget(group);
    setActiveDialog(dialog);
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };

  return { activeDialog, target, openCreate, openFor, close };
}
