'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/Button';
import type { SubMerchantListFilter, SubMerchantListResult } from '../types';
import { subMerchantQueries } from '../sub-merchant-queries';
import type { SubMerchantRowHandlers } from './SubMerchantRowActions';
import { SubMerchantListSkeleton } from './SubMerchantListSkeleton';
import { SubMerchantTable } from './SubMerchantTable';

type Props = SubMerchantRowHandlers & {
  filter: SubMerchantListFilter;
  onPageChange: (page: number, pageSize: number) => void;
};

type ListBodyProps = Props & { list: UseQueryResult<SubMerchantListResult, Error> };

function SubMerchantListBody({ list, filter, onPageChange, ...handlers }: ListBodyProps) {
  if (list.isPending) return <SubMerchantListSkeleton />;
  if (list.isError) {
    return (
      <div role="alert">
        <p>{list.error.message}</p>
        <Button type="button" variant="ghost" onClick={() => void list.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (list.data.rows.length === 0) return <p role="status">Không có điểm bán</p>;
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
    <section className="rounded-xl border bg-card p-4" aria-label="Danh sách điểm bán">
      <h2 className="mb-3 font-semibold">
        Danh sách điểm bán {list.data ? `(${list.data.total})` : ''}
      </h2>
      <SubMerchantListBody list={list} {...props} />
    </section>
  );
}
