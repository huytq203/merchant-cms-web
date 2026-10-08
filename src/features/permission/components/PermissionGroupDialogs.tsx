'use client';

import { usePreservedValue } from '@/lib/hooks/use-preserved-value';
import type { PermissionGroupDialogs as Dialogs } from '../hooks/use-permission-group-dialogs';
import type { usePermissionGroupActions } from '../hooks/use-permission-group-actions';
import { usePermissionCatalog, usePermissionGroup } from '../permission-group-queries';
import { canEditGroup } from '../utils/permission-group-mapper';
import { PermissionGroupDeleteDialog } from './PermissionGroupDeleteDialog';
import { PermissionGroupDetailModal } from './PermissionGroupDetailModal';
import { PermissionGroupModal } from './PermissionGroupModal';

interface Props {
  dialogs: Dialogs;
  actions: ReturnType<typeof usePermissionGroupActions>;
}

export function PermissionGroupDialogs({ dialogs, actions }: Props) {
  const { activeDialog, target } = dialogs;
  const shownTarget = usePreservedValue(target);
  const shownDialog = usePreservedValue(activeDialog);
  const catalog = usePermissionCatalog();
  const detail = usePermissionGroup(shownDialog === 'edit' ? shownTarget?.id ?? '' : '');
  const catalogError = catalog.isError ? catalog.error.message : undefined;
  const closeOnDismiss = (open: boolean) => {
    if (!open) actions.closeDialog();
  };
  const editFromDetail = shownTarget && canEditGroup(shownTarget) ? () => dialogs.openFor('edit', shownTarget) : undefined;

  return (
    <>
      <PermissionGroupModal
        open={activeDialog === 'create' || activeDialog === 'edit'}
        onOpenChange={closeOnDismiss}
        catalog={catalog.data ?? []}
        catalogLoading={catalog.isPending}
        group={shownDialog === 'edit' ? detail.data ?? shownTarget : null}
        isSubmitting={actions.isSaving}
        error={actions.saveError ?? catalogError}
        onSubmit={actions.save}
      />
      <PermissionGroupDetailModal
        open={activeDialog === 'detail'}
        onOpenChange={closeOnDismiss}
        group={shownTarget}
        catalog={catalog}
        onEdit={editFromDetail}
      />
      <PermissionGroupDeleteDialog
        open={activeDialog === 'delete'}
        onOpenChange={closeOnDismiss}
        group={shownTarget}
        isDeleting={actions.isDeleting}
        error={actions.deleteError}
        onConfirm={actions.confirmDelete}
      />
    </>
  );
}
