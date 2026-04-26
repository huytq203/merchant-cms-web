'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Table, Text } from '@/components/ui';
import { ColumnDef } from '@tanstack/react-table';

interface SubMerchantDetailModalProps {
  merchantIds: string[];
  userName: string;
}

interface SubMerchantItem {
  id: string;
}

export function SubMerchantDetailModal({
  merchantIds,
  userName,
}: SubMerchantDetailModalProps) {
  const [open, setOpen] = useState(false);

  const columns: ColumnDef<SubMerchantItem>[] = [
    {
      accessorKey: 'id',
      header: 'ID Sub Merchant',
      cell: ({ row }) => (
        <Text className="text-sm font-medium">{row.original.id}</Text>
      ),
    },
  ];

  const data: SubMerchantItem[] = merchantIds.map((id) => ({ id }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="xs"
        variant="link"
        onClick={() => setOpen(true)}
      >
        Xem chi tiết ({merchantIds.length})
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sub Merchants của {userName}</DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <Table
            data={data}
            columns={columns}
            pagination={false}
            enableSorting={false}
            labels={{ empty: 'Không có dữ liệu' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
