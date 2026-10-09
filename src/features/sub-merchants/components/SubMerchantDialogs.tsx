'use client';

import { useQuery } from '@tanstack/react-query';
import type { SubMerchantDialogs as Dialogs } from '../hooks/use-sub-merchant-dialogs';
import type { useSubMerchantActions } from '../hooks/use-sub-merchant-actions';
import { subMerchantQueries } from '../sub-merchant-queries';
import { canLock, canUnlock } from '../utils/sub-merchant-mapper';
import { DialogActive } from './DialogActive';
import { DialogUnActive } from './DialogUnActive';
import { SubMerchantDetailModal } from './SubMerchantDetailModal';
import { SubMerchantFormModal } from './SubMerchantFormModal';

type Props = {
  dialogs: Dialogs;
  actions: ReturnType<typeof useSubMerchantActions>;
};

export function SubMerchantDialogs({ dialogs, actions }: Props) {
  const { activeDialog, target } = dialogs;
  const needsDetail = activeDialog === 'detail' || activeDialog === 'edit';
  const detail = useQuery({
    ...subMerchantQueries.detail(target?.id ?? ''),
    enabled: Boolean(target) && needsDetail,
  });
  const closeOnDismiss = (open: boolean) => {
    if (!open) actions.closeDialog();
  };

  return (
    <>
      <SubMerchantDetailModal
        open={activeDialog === 'detail'}
        onOpenChange={closeOnDismiss}
        detail={detail.data ?? null}
        onEdit={target && (canLock(target) || canUnlock(target)) ? () => dialogs.openFor('edit', target) : undefined}
        onLock={target ? () => dialogs.openFor('lock', target) : undefined}
        onUnlock={target ? () => dialogs.openFor('unlock', target) : undefined}
      />
      <SubMerchantFormModal
        open={activeDialog === 'create' || activeDialog === 'edit'}
        onOpenChange={closeOnDismiss}
        editTarget={activeDialog === 'edit' ? detail.data : null}
        onSubmit={actions.saveForm}
        isSubmitting={actions.isSaving}
        error={actions.saveError}
      />
      <DialogActive
        open={activeDialog === 'lock'}
        onOpenChange={closeOnDismiss}
        target={target}
        onConfirm={actions.confirmLock}
        isLoading={actions.isLocking}
        error={actions.lockError}
      />
      <DialogUnActive
        open={activeDialog === 'unlock'}
        onOpenChange={closeOnDismiss}
        target={target}
        onConfirm={actions.confirmUnlock}
        isLoading={actions.isUnlocking}
        error={actions.unlockError}
      />
    </>
  );
}
