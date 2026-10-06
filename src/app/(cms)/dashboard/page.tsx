import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { Text } from "@/components/ui/typography/Typography";
import { DashboardOverview } from "@/features/dashboard/_components/DashboardOverview";
import RevenueChart from "@/features/dashboard/_components/RevenueChart";
import { dashboardQueries } from "@/features/dashboard/dashboard-queries";
import { SampleDataBanner } from "@/features/sample-data/components/SampleDataBanner";
import { resolveModuleSource } from "@/lib/be/api-mode";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { getDashboardOverview, getRevenueChart } from "@/server/modules/dashboard/dashboard.service";

function getVietnameseGreeting(): string {
  const vnHour = (new Date().getUTCHours() + 7) % 24;
  if (vnHour < 12) return "buổi sáng";
  if (vnHour < 18) return "buổi chiều";
  return "buổi tối";
}

const DEFAULT_PERIOD = "7days";

const DashboardPage = async () => {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (user.merchantIds.length === 0) return <AccessDenied />;

  const state = await prefetchDehydrated(async (client) => {
    await Promise.all([
      client.prefetchQuery({
        ...dashboardQueries.overview(),
        queryFn: async () => unwrapOrRedirect(await getDashboardOverview()),
      }),
      client.prefetchQuery({
        ...dashboardQueries.revenueChart(DEFAULT_PERIOD),
        queryFn: async () => unwrapOrRedirect(await getRevenueChart(DEFAULT_PERIOD)),
      }),
    ]);
  });

  return (
    <div className="space-y-6">
      {resolveModuleSource("dashboard") === "fixture" && <SampleDataBanner />}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Chào {getVietnameseGreeting()},{" "}
          <span className="text-primary">{user.username ?? "Merchant"}</span>!
        </h2>
        <Text size="sm" color="muted" as="p" className="mt-1">
          Dưới đây là báo cáo vận hành hôm nay
        </Text>
      </div>
      <HydrationBoundary state={state}>
        <DashboardOverview chart={<RevenueChart />} />
      </HydrationBoundary>
    </div>
  );
};

export default DashboardPage;
