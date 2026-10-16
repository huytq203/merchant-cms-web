import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Đang tải ký quỹ">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <section className="space-y-5 rounded-xl border border-border bg-background p-6">
        <Skeleton className="h-6 w-56" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((index) => <Skeleton key={index} className="h-14 w-full" />)}
        </div>
        <Skeleton className="h-4 w-80" />
      </section>
      {[4, 8].map((rows) => (
        <section key={rows} className="rounded-xl border border-border bg-background p-4">
          <Skeleton className="mb-4 h-6 w-48" />
          {Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="mb-2 h-11 w-full" />)}
        </section>
      ))}
    </div>
  );
}
