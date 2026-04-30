'use client';
import { useParams } from 'next/navigation';
import { NewSubMerchantForm } from '@/features/sub-merchants/components/NewSubMerchantForm';
import { useSubMerchantByIdQuery } from '@/features/sub-merchants/hooks/use-sub-merchants-query';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export default function EditSubMerchantPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useSubMerchantByIdQuery(id);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Không tìm thấy sub-merchant hoặc đã xảy ra lỗi.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chỉnh sửa Sub-merchant</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Cập nhật thông tin cho <span className="font-medium text-foreground">{data.name}</span>
        </p>
      </div>
      <NewSubMerchantForm initialData={data} />
    </div>
  );
}
