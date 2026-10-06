'use client';

import type { PermissionGroupDialogs as Dialogs } from '../hooks/use-permission-group-dialogs';
import type { usePermissionGroupActions } from '../hooks/use-permission-group-actions';
import { usePermissionCatalog, usePermissionGroup } from '../permission-group-queries';
import { PermissionGroupDeleteDialog } from './PermissionGroupDeleteDialog';
import { PermissionGroupDetailModal } from './PermissionGroupDetailModal';
import { PermissionGroupModal } from './PermissionGroupModal';

interface Props {
  dialogs: Dialogs;
  actions: ReturnType<typeof usePermissionGroupActions>;
}

export function PermissionGroupDialogs({ dialogs, actions }: Props) {
  const { activeDialog, target } = dialogs;
  const catalog = usePermissionCatalog();
  const detail = usePermissionGroup(activeDialog === 'edit' ? target?.id ?? '' : '');
  const catalogError = catalog.isError ? catalog.error.message : undefined;
  const closeOnDismiss = (open: boolean) => {
    if (!open) actions.closeDialog();
  };

  return (
    <>
      <PermissionGroupModal
        open={activeDialog === 'create' || activeDialog === 'edit'}
        onOpenChange={closeOnDismiss}
        catalog={catalog.data ?? []}
        group={activeDialog === 'edit' ? detail.data ?? target : null}
        isSubmitting={actions.isSaving}
        error={actions.saveError ?? catalogError}
        onSubmit={actions.save}
      />
      <PermissionGroupDetailModal
        open={activeDialog === 'detail'}
        onOpenChange={closeOnDismiss}
        group={target}
      />
      <PermissionGroupDeleteDialog
        open={activeDialog === 'delete'}
        onOpenChange={closeOnDismiss}
        group={target}
        isDeleting={actions.isDeleting}
        error={actions.deleteError}
        onConfirm={actions.confirmDelete}
      />
    </>
  );
}
