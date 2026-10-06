import { Skeleton } from '@/components/ui/skeleton/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-72" />
      <section className="rounded-xl border bg-card p-4">
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="mt-4 ml-auto h-10 w-36" />
      </section>
      <section className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-4 h-8 w-full" />
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="mb-2 h-11 w-full" />
        ))}
      </section>
    </div>
  );
}
