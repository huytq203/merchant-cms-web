import { useState } from 'react';
import type { SubMerchantRow } from '../types';

export type SubMerchantDialogs = ReturnType<typeof useSubMerchantDialogs>;

type DialogName = 'detail' | 'create' | 'edit' | 'lock' | 'unlock';

export function useSubMerchantDialogs() {
  const [activeDialog, setActiveDialog] = useState<DialogName | null>(null);
  const [target, setTarget] = useState<SubMerchantRow | null>(null);
  const openCreate = () => {
    setTarget(null);
    setActiveDialog('create');
  };
  const openFor = (dialog: Exclude<DialogName, 'create'>, row: SubMerchantRow) => {
    setTarget(row);
    setActiveDialog(dialog);
  };
  const close = () => {
    setActiveDialog(null);
    setTarget(null);
  };
  return { activeDialog, target, openCreate, openFor, close };
}
