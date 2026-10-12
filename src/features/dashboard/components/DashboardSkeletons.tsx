import { Card } from "@/components/ui/card/Card";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";

export const STAT_GRID = {
  1: "sm:grid-cols-2 xl:grid-cols-1",
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
} as const;

export function StatCardsSkeleton({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <Card key={index} className="h-[106px]">
      <div className="flex gap-3.5 p-5">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </Card>
  ));
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <Card><Skeleton className="h-[372px]" /></Card>
      <Card><Skeleton className="h-[372px]" /></Card>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <Card className="space-y-2 p-5">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-10 w-full" />)}
    </Card>
  );
}

export function GreetingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-56" />
    </div>
  );
}
