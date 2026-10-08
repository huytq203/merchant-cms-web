'use client';

import { Plus } from 'lucide-react';
import { getRouteTitle } from '@/app/(cms)/_layout/constants/route.constants';
import { PageHeader } from '@/components/page/PageHeader';
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
      <PageHeader
        title={getRouteTitle('/sub-merchants')}
        action={
        <Button type="button" variant="solid" onClick={dialogs.openCreate}>
          <Plus size={16} aria-hidden="true" /> Thêm mới
        </Button>
        }
      />
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
