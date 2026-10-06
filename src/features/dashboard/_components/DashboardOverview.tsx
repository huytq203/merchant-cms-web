"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Target, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton/Skeleton";
import { ModuleQueryError } from "@/features/sample-data/components/ModuleQueryError";
import { dashboardQueries } from "../dashboard-queries";
import { toStatCardValues, type StatCardKey } from "../utils/dashboard-stats";
import { RecentTransactions } from "./RecentTransactions";
import { StatCard } from "./StatCard";
import { MerchantHierarchyCard } from "./MerchantHierarchyCard";

const STAT_ICONS: Record<StatCardKey, { icon: ReactNode; iconClassName: string }> = {
  balance: { icon: <Wallet className="w-5 h-5" />, iconClassName: "bg-primary/10 text-primary" },
  revenue: { icon: <TrendingUp className="w-5 h-5" />, iconClassName: "bg-success/10 text-success" },
  successful: { icon: <CreditCard className="w-5 h-5" />, iconClassName: "bg-warning/10 text-warning" },
  conversion: { icon: <Target className="w-5 h-5" />, iconClassName: "bg-danger/10 text-danger" },
};

const STATS_GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]";

function StatsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Đang tải tổng quan" className={STATS_GRID}>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28" />
      ))}
    </div>
  );
}

/**
 * Headline cards and recent transactions come from one overview request. The chart is passed in
 * so it keeps its place between them and loads independently.
 */
export function DashboardOverview({ chart }: { chart: ReactNode }) {
  const overview = useQuery(dashboardQueries.overview());

  if (overview.isPending) {
    return (
      <div className="space-y-6">
        <StatsSkeleton />
        {chart}
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (overview.isError) {
    return (
      <div className="space-y-6">
        <ModuleQueryError error={overview.error} onRetry={() => void overview.refetch()} />
        {chart}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className={STATS_GRID}>
        {toStatCardValues(overview.data.summary).map(({ key, title, value, trend }) => (
          <StatCard key={key} title={title} value={value} trend={trend} featured={key === 'balance'} {...STAT_ICONS[key]} />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        {chart}
        <MerchantHierarchyCard summary={overview.data.summary} />
      </div>
      <RecentTransactions rows={overview.data.recentTransactions} />
    </div>
  );
}
