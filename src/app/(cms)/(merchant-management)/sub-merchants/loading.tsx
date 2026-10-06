import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-3 h-6 w-48" />
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
