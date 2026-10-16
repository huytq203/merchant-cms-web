import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Đang tải dòng quyết toán">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-background p-4">
        <Skeleton className="h-10 min-w-[200px] flex-1" />
        <Skeleton className="h-10 min-w-[200px] flex-1" />
        <Skeleton className="h-10 w-52" />
      </section>
      <section className="space-y-3 rounded-xl border border-border bg-background p-4">
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-7 w-full max-w-2xl" />
        <Skeleton className="h-7 w-full max-w-2xl" />
      </section>
      <section className="rounded-xl border border-border bg-background p-4">
        <Skeleton className="mb-4 h-9 w-full" />
        {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="mb-2 h-16 w-full" />)}
      </section>
    </div>
  );
}
