'use client';
import { Table } from '@/components/ui';
import { type ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { getColumn } from '../columns/SubMerchantColumn';
import { SubMerchantDetailSheet } from './SubMerchantDetailSheet';
import type { SubMerchant } from '../types';

interface SubMerchantTableProps {
  data: SubMerchant[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  onEdit: (item: SubMerchant) => void;
  onDelete: (item: SubMerchant) => void;
}

export function SubMerchantTable({
  data,
  isLoading,
  total,
  page = 1,
  pageSize = 10,
  onPageChange,
  onEdit,
  onDelete,
}: SubMerchantTableProps) {
  const [selected, setSelected] = useState<SubMerchant | null>(null);

  const columns = useMemo<ColumnDef<SubMerchant>[]>(
    () => getColumn(setSelected, onEdit, onDelete),
    [onEdit, onDelete],
  );

  return (
    <>
      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        labels={{ empty: 'Không tìm thấy sub-merchant nào phù hợp' }}
        pagination={
          total !== undefined
            ? {
                total,
                current: page,
                pageSize,
                pageSizeOptions: [10, 20, 50],
                onChange: onPageChange,
              }
            : false
        }
      />

      <SubMerchantDetailSheet
        subMerchant={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
