import { Skeleton } from "@/components/ui/skeleton/Skeleton";

/** Loading shape of the result table: header row plus data rows. */
export function TerminalResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải danh sách Terminal" className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
