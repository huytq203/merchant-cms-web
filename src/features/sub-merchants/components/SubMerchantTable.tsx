'use client';

import { Table } from '@/components/ui/table/Table';
import { getColumn } from '../columns/SubMerchantColumn';
import type { SubMerchantRowHandlers } from './SubMerchantRowActions';
import type { SubMerchantRow } from '../types';

type Props = SubMerchantRowHandlers & {
  data: SubMerchantRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
};

export function SubMerchantTable({
  data,
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  ...handlers
}: Props) {
  const columns = getColumn(handlers, page, pageSize);
  const pagination = total === undefined
    ? false
    : { total, current: page, pageSize, onChange: onPageChange };

  return (
    <Table
      data={data}
      columns={columns}
      labels={{ empty: 'Không có Sub-merchant' }}
      pagination={pagination}
    />
  );
}
