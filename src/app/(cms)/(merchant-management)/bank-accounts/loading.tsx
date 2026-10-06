import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="ml-auto mt-4 h-10 w-48" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
