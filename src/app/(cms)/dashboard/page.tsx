import type { Route } from "next";
import { redirect } from "next/navigation";
import { findLandingPath } from "@/app/(cms)/_layout/constants/route.constants";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { DashboardView } from "@/features/dashboard/components/DashboardView";
import { getServerSession } from "@/lib/auth/session";

function getVietnameseGreeting(): string {
  const vnHour = (new Date().getUTCHours() + 7) % 24;
  if (vnHour < 12) return "buổi sáng";
  if (vnHour < 18) return "buổi chiều";
  return "buổi tối";
}

const DashboardPage = async () => {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (user.merchantIds.length === 0) {
    // The overview is per Master; a Sub-only session goes straight to the first page it may open.
    const landing = findLandingPath({ permissions: user.permissions, hasMerchant: false });
    if (landing) redirect(landing as Route);
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Chào {getVietnameseGreeting()}, <span className="text-primary">{user.username ?? "Merchant"}</span>!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Dưới đây là báo cáo vận hành hôm nay</p>
      </div>
      <DashboardView permissions={user.permissions} />
    </div>
  );
};

export default DashboardPage;
