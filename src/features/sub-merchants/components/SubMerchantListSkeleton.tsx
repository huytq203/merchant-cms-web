import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export function SubMerchantListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách Sub-merchant">
      {Array.from({ length: 10 }, (_, index) => (
        <Skeleton key={index} className="mb-2 h-10 w-full" />
      ))}
    </div>
  );
}
