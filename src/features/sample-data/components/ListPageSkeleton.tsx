import { Skeleton } from "@/components/ui/skeleton/Skeleton";

type Props = { filterRows: number; hasAction?: boolean };

/** Loading shape of a list page: header, filter card and results card. */
export function ListPageSkeleton({ filterRows, hasAction = true }: Props) {
  return (
    <div className="space-y-5" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-64" />
        {hasAction && <Skeleton className="h-10 w-36" />}
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="space-y-3">
          {Array.from({ length: filterRows }, (_, row) => (
            <div key={row} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, column) => (
                <Skeleton key={column} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
        <Skeleton className="ml-auto mt-4 h-10 w-48" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-3 h-6 w-48" />
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
