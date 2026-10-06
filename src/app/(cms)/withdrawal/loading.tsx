import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-52" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
