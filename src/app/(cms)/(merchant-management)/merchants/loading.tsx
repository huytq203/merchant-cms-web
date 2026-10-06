import { Skeleton } from "@/components/ui/skeleton/Skeleton";

function CardSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <CardSkeleton rows={6} />
      <CardSkeleton rows={3} />
      <div className="space-y-3 rounded-xl border border-border bg-background p-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
