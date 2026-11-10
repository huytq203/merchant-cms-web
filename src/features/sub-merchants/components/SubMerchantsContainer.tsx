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
import { SubMerchantFilters } from './SubMerchantFilters';
import { SubMerchantList } from './SubMerchantList';

type Props = { filter: SubMerchantListFilter; canLock: boolean };

export function SubMerchantsContainer({ filter, canLock }: Props) {
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
      <SubMerchantFilters
        key={`${filter.code ?? ''}:${filter.name ?? ''}:${filter.status ?? ''}:${String(filter.hasBankAccount)}:${filter.createdFrom ?? ''}:${filter.createdTo ?? ''}`}
        defaultValues={{
          code: filter.code,
          name: filter.name,
          status: filter.status,
          hasBankAccount: filter.hasBankAccount,
          createdFrom: filter.createdFrom,
          createdTo: filter.createdTo,
        }}
        onSearch={navigation.search}
      />
      <SubMerchantList
        filter={filter}
        onPageChange={navigation.changePage}
        onViewDetail={(row) => dialogs.openFor('detail', row)}
        onEdit={(row) => dialogs.openFor('edit', row)}
        onLock={canLock ? (row) => dialogs.openFor('lock', row) : undefined}
        onUnlock={canLock ? (row) => dialogs.openFor('unlock', row) : undefined}
      />
      <SubMerchantDialogs dialogs={dialogs} actions={actions} canLock={canLock} />
    </div>
  );
}
