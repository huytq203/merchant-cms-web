'use client';
import * as Card from '@/components/ui/card/Card';
import { Button } from '@/components/ui';
import { SubMerchantFilters } from '@/features/sub-merchants/components/SubMerchantFilters';
import { SubMerchantFormSheet } from '@/features/sub-merchants/components/SubMerchantFormSheet';
import { SubMerchantTable } from '@/features/sub-merchants/components/SubMerchantTable';
import {
  useCreateSubMerchant,
  useDeleteSubMerchant,
  useUpdateSubMerchant,
} from '@/features/sub-merchants/hooks/use-sub-merchant-mutations';
import { useSubMerchantsQuery } from '@/features/sub-merchants/hooks/use-sub-merchants-query';
import type { SubMerchantFilterValues, SubMerchantFormValues } from '@/features/sub-merchants/schemas';
import type { SubMerchant } from '@/features/sub-merchants/types';
import usePagination from '@/hooks/usePagination';
import { Download, Filter, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet/Sheet';
import Link from 'next/link';

export default function SubMerchantsPage() {
  const [filter, setFilter] = useState<SubMerchantFilterValues>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubMerchant | null>(null);

  const { setPage, setPageSize, params, page, pageSize } = usePagination();

  const { data, isLoading } = useSubMerchantsQuery({ ...params, ...filter });

  const createMutation = useCreateSubMerchant();
  const updateMutation = useUpdateSubMerchant(editTarget?.id ?? '');
  const deleteMutation = useDeleteSubMerchant();

  const handleSearch = (values: SubMerchantFilterValues) => {
    setFilter(values);
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: SubMerchant) => {
    setEditTarget(item);
    setIsFormOpen(true);
  };

  const handleDelete = (item: SubMerchant) => {
    if (!confirm(`Xác nhận xóa sub-merchant "${item.name}"?`)) return;

    deleteMutation.mutate(item.id, {
      onSuccess: () => toast.success('Đã xóa sub-merchant thành công'),
      onError: () => toast.error('Xóa sub-merchant thất bại'),
    });
  };

  const handleFormSubmit = (values: SubMerchantFormValues) => {
    if (editTarget) {
      updateMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Cập nhật sub-merchant thành công');
          setIsFormOpen(false);
        },
        onError: () => toast.error('Cập nhật sub-merchant thất bại'),
      });
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Thêm sub-merchant thành công');
          setIsFormOpen(false);
        },
        onError: () => toast.error('Thêm sub-merchant thất bại'),
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Danh sách Sub-merchant
          </h1>
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
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Thêm mới
          </Button>
        </Link>
        </div>
      </div>
      <Card.Card>
        <Card.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Card.CardTitle className="text-base">Tìm kiếm</Card.CardTitle>
          </div>
        </Card.CardHeader>

        <Card.CardContent>
          <SubMerchantFilters onSearch={handleSearch} defaultValues={filter} />
        </Card.CardContent>
      </Card.Card>

      {/* Table */}
      <Card.Card>
        <Card.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Card.CardTitle className="text-base">
              Kết quả tìm kiếm
              {!!data && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({data.pagination.total} sub-merchant)
                </span>
              )}
            </Card.CardTitle>
          </div>
        </Card.CardHeader>
        <Card.CardContent>
          <SubMerchantTable
            data={data?.data ?? []}
            isLoading={isLoading}
            total={data?.pagination.total}
            page={page}
            pageSize={pageSize}
            onPageChange={(p, ps) => {
              setPage(p);
              setPageSize(ps);
            }}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </Card.CardContent>
      </Card.Card>
      {/* Form Sheet */}
      <SubMerchantFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editTarget={editTarget}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
