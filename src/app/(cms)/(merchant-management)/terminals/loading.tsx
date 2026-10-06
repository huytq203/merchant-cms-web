import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-3 h-6 w-48" />
        <Skeleton className="mb-2 h-10 w-full" />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
