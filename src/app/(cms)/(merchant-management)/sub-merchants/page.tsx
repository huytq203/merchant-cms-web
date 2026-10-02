'use client';
import * as Card from '@/components/ui/card/Card';
import { Button } from '@/components/ui';
import { SubMerchantFilters } from '@/features/sub-merchants/components/SubMerchantFilters';
import { SubMerchantTable } from '@/features/sub-merchants/components/SubMerchantTable';
import { useToggleSubMerchantStatus } from '@/features/sub-merchants/hooks/use-sub-merchant-mutations';
import { useSubMerchantsQuery } from '@/features/sub-merchants/hooks/use-sub-merchants-query';
import type { SubMerchantFilterValues } from '@/features/sub-merchants/schemas';
import type { SubMerchant } from '@/features/sub-merchants/types';
import { DialogActive } from '@/features/sub-merchants/components/DialogActive';
import { DialogUnActive } from '@/features/sub-merchants/components/DialogUnActive';
import usePagination from '@/hooks/usePagination';
import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SubMerchantsPage() {
  const [filter, setFilter] = useState<SubMerchantFilterValues>({});
  const [lockTarget, setLockTarget] = useState<SubMerchant | null>(null);
  const [dialogMode, setDialogMode] = useState<'locked' | 'unlocked' | null>(null);
  const router = useRouter();

  const { setPage, setPageSize, params, page, pageSize } = usePagination();
  const { data, isLoading } = useSubMerchantsQuery({ ...params, ...filter });
  const { mutate: toggleStatus, isPending: isToggling } = useToggleSubMerchantStatus();

  const handleSearch = (values: SubMerchantFilterValues) => {
    setFilter(values);
    setPage(1);
  };

  const handleEdit = (item: SubMerchant) => {
    router.push(`/sub-merchants/${item.id}/edit`);
  };

  const handleUpdate = (item: SubMerchant) => {
    setLockTarget(item);
    setDialogMode(item.status === 'locked' ? 'unlocked' : 'locked');
  };

  const handleCloseDialog = () => {
    setLockTarget(null);
    setDialogMode(null);
  };

  const handleLockConfirm = (reason: string) => {
    if (!lockTarget) return;
    toggleStatus(
      { id: lockTarget.id, lockReason: reason, lockedAt: new Date().toISOString() },
      {
        onSuccess: () => { toast.success('Đã khóa sub-merchant thành công'); handleCloseDialog(); },
        onError: () => toast.error('Khóa sub-merchant thất bại'),
      },
    );
  };

  const handleUnlockConfirm = () => {
    if (!lockTarget) return;
    toggleStatus(
      { id: lockTarget.id, lockReason: null, lockedAt: null },
      {
        onSuccess: () => { toast.success('Đã mở khóa sub-merchant thành công'); handleCloseDialog(); },
        onError: () => toast.error('Mở khóa sub-merchant thất bại'),
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh sách Sub-merchant</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý tất cả sub-merchant thuộc hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Đang chuẩn bị dữ liệu...')}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Xuất Excel
          </Button>
          <Link href="/sub-merchants/new">
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Thêm mới
            </Button>
          </Link>
        </div>
      </div>

      <Card.Card>
        <Card.CardHeader className="pb-3">
          <Card.CardTitle className="text-base">Tìm kiếm</Card.CardTitle>
        </Card.CardHeader>
        <Card.CardContent>
          <SubMerchantFilters onSearch={handleSearch} defaultValues={filter} />
        </Card.CardContent>
      </Card.Card>

      <Card.Card>
        <Card.CardHeader className="pb-3">
          <Card.CardTitle className="text-base">
            Kết quả tìm kiếm
            {!!data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({data.pagination.total} sub-merchant)
              </span>
            )}
          </Card.CardTitle>
        </Card.CardHeader>
        <Card.CardContent>
          <SubMerchantTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={data?.pagination.total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            onEdit={handleEdit}
            onUpdate={handleUpdate}
          />
        </Card.CardContent>
      </Card.Card>

      <DialogActive
        open={dialogMode === 'locked'}
        onOpenChange={(open) => { if (!open) handleCloseDialog(); }}
        merchantName={lockTarget?.name}
        onConfirm={handleLockConfirm}
        isLoading={isToggling}
      />
      <DialogUnActive
        open={dialogMode === 'unlocked'}
        onOpenChange={(open) => { if (!open) handleCloseDialog(); }}
        lockReason={lockTarget?.reason}
        lockedBy={lockTarget?.lockedBy}
        lockedAt={lockTarget?.lockedAt}
        onConfirm={handleUnlockConfirm}
        isLoading={isToggling}
      />
    </div>
  );
}
