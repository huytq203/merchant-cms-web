'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button/Button';
import { useSubMerchantActions } from '../hooks/use-sub-merchant-actions';
import { useSubMerchantDialogs } from '../hooks/use-sub-merchant-dialogs';
import { useSubMerchantListNavigation } from '../hooks/use-sub-merchant-list-navigation';
import type { SubMerchantListFilter } from '../types';
import { SubMerchantDialogs } from './SubMerchantDialogs';
import { SubMerchantList } from './SubMerchantList';

type Props = { filter: SubMerchantListFilter };

export function SubMerchantsContainer({ filter }: Props) {
  const dialogs = useSubMerchantDialogs();
  const actions = useSubMerchantActions(dialogs);
  const navigation = useSubMerchantListNavigation();

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh sách Sub-merchant</h1>
        <Button type="button" variant="solid" onClick={dialogs.openCreate}>
          <Plus size={16} aria-hidden="true" /> Thêm mới
        </Button>
      </header>
      <SubMerchantList
        filter={filter}
        onPageChange={navigation.changePage}
        onViewDetail={(row) => dialogs.openFor('detail', row)}
        onEdit={(row) => dialogs.openFor('edit', row)}
        onLock={(row) => dialogs.openFor('lock', row)}
        onUnlock={(row) => dialogs.openFor('unlock', row)}
      />
      <SubMerchantDialogs dialogs={dialogs} actions={actions} />
    </div>
  );
}
