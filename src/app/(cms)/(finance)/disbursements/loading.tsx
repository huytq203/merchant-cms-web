import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Đang tải chi hộ">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-72" />
      </div>
      <section className="space-y-2 rounded-xl border border-border bg-background p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {[4, 4].map((rows, index) => (
          <section key={index} className="space-y-3 rounded-xl border border-border bg-background p-6">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: rows }, (_, row) => <Skeleton key={row} className="h-8 w-full" />)}
          </section>
        ))}
      </div>
    </div>
  );
}
