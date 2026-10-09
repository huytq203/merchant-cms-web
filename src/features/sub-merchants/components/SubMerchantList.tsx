'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { ResultCard } from '@/components/page/ResultCard';
import { ResultState } from '@/components/page/ResultState';
import type { SubMerchantListFilter, SubMerchantListResult } from '../types';
import { subMerchantQueries } from '../sub-merchant-queries';
import type { SubMerchantRowHandlers } from './SubMerchantRowActions';
import { SubMerchantTable } from './SubMerchantTable';

type Props = SubMerchantRowHandlers & {
  filter: SubMerchantListFilter;
  onPageChange: (page: number, pageSize: number) => void;
};

type ListBodyProps = Props & { list: UseQueryResult<SubMerchantListResult, Error> };

function SubMerchantListBody({ list, filter, onPageChange, ...handlers }: ListBodyProps) {
  if (list.isPending) return <ResultState state="loading" />;
  if (list.isError) return <ResultState state="error" errorMessage={list.error.message} onRetry={() => void list.refetch()} />;
  if (list.data.rows.length === 0) return <ResultState state="empty" emptyMessage="Chưa có Sub-merchant phù hợp." />;
  return (
    <SubMerchantTable
      data={list.data.rows}
      total={list.data.total}
      page={filter.page}
      pageSize={filter.pageSize}
      onPageChange={onPageChange}
      {...handlers}
    />
  );
}

export function SubMerchantList(props: Props) {
  const list = useQuery(subMerchantQueries.list(props.filter));

  return (
    <ResultCard subject="Sub-merchant" total={list.data?.total ?? 0}>
      <SubMerchantListBody list={list} {...props} />
    </ResultCard>
  );
}
