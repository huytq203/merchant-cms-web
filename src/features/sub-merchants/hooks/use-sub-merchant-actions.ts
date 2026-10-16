import { toast } from 'sonner';
import type { SubMerchantSubmitValues } from '../utils/sub-merchant-form-values';
import type { SubMerchantDialogs } from './use-sub-merchant-dialogs';
import {
  useLockSubMerchant,
  useSaveSubMerchant,
  useUnlockSubMerchant,
} from './use-sub-merchant-mutations';

/** Coordinates save/lock/unlock with the open dialog; server errors stay visible in the dialog. */
export function useSubMerchantActions(dialogs: SubMerchantDialogs) {
  const save = useSaveSubMerchant(dialogs.activeDialog === 'edit' ? dialogs.target?.id : undefined);
  const lock = useLockSubMerchant();
  const unlock = useUnlockSubMerchant();

  const saveForm = async (values: SubMerchantSubmitValues) => {
    try {
      const saved = await save.mutateAsync({ ...values, phone: values.phone ?? '', address: values.address ?? '' });
      dialogs.close();
      toast.success('Lưu Sub-merchant thành công');
      if (saved.settlementBankAccountWarning) toast.warning(saved.settlementBankAccountWarning);
    } catch {
      // The form stays open and shows the save error so the user can retry.
    }
  };

  const confirmLock = async (reason: string) => {
    if (!dialogs.target) return;
    try {
      await lock.mutateAsync({ id: dialogs.target.id, reason });
      dialogs.close();
      toast.success('Khóa Sub-merchant thành công');
    } catch {
      // The server error stays visible in the dialog.
    }
  };

  const confirmUnlock = async (reason: string) => {
    if (!dialogs.target) return;
    try {
      await unlock.mutateAsync({ id: dialogs.target.id, reason });
      dialogs.close();
      toast.success('Mở khóa Sub-merchant thành công');
    } catch {
      // The server error stays visible in the dialog.
    }
  };

  const closeDialog = () => {
    save.reset();
    lock.reset();
    unlock.reset();
    dialogs.close();
  };

  return {
    saveForm,
    confirmLock,
    confirmUnlock,
    closeDialog,
    isSaving: save.isPending,
    saveError: save.error?.message,
    isLocking: lock.isPending,
    lockError: lock.error?.message,
    isUnlocking: unlock.isPending,
    unlockError: unlock.error?.message,
  };
}
