import { Suspense } from "react";
import type { MerchantPermission } from "@/features/auth/permissions";
import { Notice } from "@/components/page/Notice";
import { visibleRegions } from "../utils/regions";
import { ChartsSkeleton, ListSkeleton, StatCardsSkeleton, STAT_GRID } from "./DashboardSkeletons";
import { OrderCharts } from "./OrderCharts";
import { OrderStatCards } from "./OrderStatCards";
import { RecentOrders } from "./RecentOrders";
import { RecentWithdrawals } from "./RecentWithdrawals";
import { RevenueBySubCard } from "./RevenueBySubCard";
import { TerminalStatCard } from "./TerminalStatCard";

/** Every region loads on its own: a slow or failed one never holds back the rest. */
export function DashboardView({ permissions }: { permissions: readonly MerchantPermission[] }) {
  const regions = visibleRegions(permissions);
  if (!regions.any) {
    return <Notice tone="info">Tài khoản của bạn chưa được cấp quyền xem số liệu nào ở trang này. Dùng menu bên trái để mở các trang được phép.</Notice>;
  }
  const lists = regions.orders && regions.withdrawals ? "xl:grid-cols-2" : "xl:grid-cols-1";
  return (
    <div className="space-y-6">
      {regions.statCards > 0 && (
        <div className={`grid gap-4 ${STAT_GRID[regions.statCards as keyof typeof STAT_GRID]}`}>
          {regions.orders && (
            <Suspense fallback={<StatCardsSkeleton count={3} />}>
              <OrderStatCards />
            </Suspense>
          )}
          {regions.terminals && (
            <Suspense fallback={<StatCardsSkeleton count={1} />}>
              <TerminalStatCard />
            </Suspense>
          )}
        </div>
      )}
      {regions.orders && (
        <Suspense fallback={<ChartsSkeleton />}>
          <OrderCharts />
        </Suspense>
      )}
      {/* Client region: it loads after the page, with its own skeleton, error and empty states. */}
      {regions.revenue && <RevenueBySubCard />}
      {(regions.orders || regions.withdrawals) && (
        <div className={`grid gap-4 ${lists}`}>
          {regions.orders && (
            <Suspense fallback={<ListSkeleton />}>
              <RecentOrders />
            </Suspense>
          )}
          {regions.withdrawals && (
            <Suspense fallback={<ListSkeleton />}>
              <RecentWithdrawals />
            </Suspense>
          )}
        </div>
      )}
    </div>
  );
}
