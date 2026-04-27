'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Table, Text } from '@/components/ui';
import { ColumnDef } from '@tanstack/react-table';
import { useQueries } from '@tanstack/react-query';
import { subMerchantApi } from '@/lib/api/SubMerchant';

interface SubMerchantItem {
  id: string;
  name: string;
}

interface SubMerchantDetailModalProps {
  merchantIds: string[];
  userName: string;
}

export function SubMerchantDetailModal({
  merchantIds,
  userName,
}: SubMerchantDetailModalProps) {
  const [open, setOpen] = useState(false);

  const merchantQueries = useQueries({
    queries: (merchantIds ?? []).map((id) => ({
      queryKey: ['sub-merchant', id],
      queryFn: () => subMerchantApi.getById(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const data: SubMerchantItem[] = merchantQueries
    .map((query, index) => {
      const id = merchantIds[index];
      return id ? { id, name: query.data?.name || 'N/A' } : null;
    })
    .filter((item) => item !== null) as SubMerchantItem[];

  const isLoading = merchantQueries.some((query) => query.isLoading);

  const columns: ColumnDef<SubMerchantItem>[] = [
    {
      accessorKey: 'id',
      header: 'ID Sub Merchant',
      cell: ({ row }) => (
        <Text className="text-sm font-medium">{row.original.id}</Text>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tên Sub Merchant',
      cell: ({ row }) => (
        <Text className="text-sm font-medium">{row.original.name}</Text>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="xs"
        variant="link"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        Xem chi tiết ({merchantIds?.length || 0})
      </Button>

      <DialogContent className='space-y-3'>
        <DialogHeader>
          <DialogTitle>Sub Merchants của {userName}</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Text className="text-sm text-muted-foreground">Đang tải...</Text>
            </div>
          ) : (
            <Table
              data={data}
              columns={columns}
              pagination={false}
              enableSorting={false}
              labels={{ empty: 'Không có dữ liệu' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
