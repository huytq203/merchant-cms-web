'use client';
import { Table } from '@/components/ui';
import { cn } from '@/lib/utils/cn';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, Lock, Pencil, Unlock } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Merchant } from '../types';
import { LockMerchantDialog } from './LockMerchantDialog';
import Link from 'next/link';
import { getColumn } from '../columns/MerchantColumn';

interface MerchantTableProps {
  data: Merchant[];
  isLoading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
}



export function MerchantTable({
  data,
  isLoading,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
}: MerchantTableProps) {
  const [lockTarget, setLockTarget] = useState<{ merchant: Merchant; action: 'lock' | 'unlock' } | null>(null);

  const columns = useMemo<ColumnDef<Merchant>[]>(
    () => getColumn(setLockTarget),
    [setLockTarget]
  );

  return (
    <>
      <Table
        data={data}
        columns={columns}
        isLoading={isLoading}
        labels={{ empty: 'Không tìm thấy merchant nào phù hợp' }}
        pagination={
          total !== undefined
            ? {
                total,
                current: page,
                pageSize,
                pageSizeOptions: [20, 50, 100],
                onChange: onPageChange,
              }
            : false
        }
      />

      {lockTarget && (
        <LockMerchantDialog
          merchant={lockTarget.merchant}
          action={lockTarget.action}
          open={!!lockTarget}
          onOpenChange={(open) => {
            if (!open) setLockTarget(null);
          }}
        />
      )}
    </>
  );
}
