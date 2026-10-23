import { Skeleton } from "@/components/ui/skeleton/Skeleton";

/** Mirrors the inbox layout (header, filter tabs, table) to avoid a layout shift on load. */
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-56" />
      </div>
      <Skeleton className="h-9 w-44" />
      <section className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-4 h-8 w-full" />
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-14 w-full" />
        ))}
      </section>
    </div>
  );
}
