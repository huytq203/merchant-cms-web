import { Skeleton } from "@/components/ui/skeleton/Skeleton";

/** Loading shape of the user table: header row plus data rows. */
export function UserResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách người dùng" className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
