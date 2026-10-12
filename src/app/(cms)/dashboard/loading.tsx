import { ChartsSkeleton, GreetingSkeleton, ListSkeleton, STAT_GRID, StatCardsSkeleton } from "@/features/dashboard/components/DashboardSkeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <GreetingSkeleton />
      <div className={`grid gap-4 ${STAT_GRID[4]}`}>
        <StatCardsSkeleton count={4} />
      </div>
      <ChartsSkeleton />
      <div className="grid gap-4 xl:grid-cols-2">
        <ListSkeleton />
        <ListSkeleton />
      </div>
    </div>
  );
}
