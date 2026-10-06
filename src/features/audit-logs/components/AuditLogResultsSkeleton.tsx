import { Skeleton } from '@/components/ui/skeleton/Skeleton';

/** Loading shape of the audit table: header row plus data rows. */
export function AuditLogResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải nhật ký" className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}
