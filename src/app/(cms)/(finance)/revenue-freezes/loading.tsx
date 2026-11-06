import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5" role="status" aria-busy="true" aria-label="Đang tải khoản đóng băng">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-96 max-w-full" />
        </div>
      </div>
      <section className="rounded-xl border border-border bg-background p-4">
        {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="mb-2 h-12 w-full" />)}
      </section>
    </div>
  );
}
