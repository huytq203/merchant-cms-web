import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export function PermissionGroupListSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách nhóm quyền">
      <Skeleton className="mb-3 h-10 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="mb-2 h-12 w-full" />
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
