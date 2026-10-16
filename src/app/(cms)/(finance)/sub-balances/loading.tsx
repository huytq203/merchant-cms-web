import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Đang tải số dư">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-72" />
      </div>
      <section className="flex flex-wrap items-end justify-between gap-6 rounded-xl border border-border bg-background p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-48" />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        {[3, 4].map((rows) => (
          <section key={rows} className="space-y-3 rounded-xl border border-border bg-background p-6">
            <Skeleton className="h-5 w-56" />
            {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
          </section>
        ))}
      </div>
    </div>
  );
}
