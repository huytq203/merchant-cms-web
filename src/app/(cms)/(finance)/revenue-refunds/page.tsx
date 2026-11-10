import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { RevenueRefundsContainer } from "@/features/revenue-refunds/components/RevenueRefundsContainer";
import { parseRefundSearchParams, revenueRefundQueries } from "@/features/revenue-refunds/revenue-refund-queries";
import { toRefundQuery } from "@/features/revenue-refunds/utils/refund-query";
import { getServerSession } from "@/lib/auth/session";
import { vnToday } from "@/lib/utils/vn-time";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { getRevenueRefundSummary, listRevenueRefunds } from "@/server/modules/revenue-refunds/revenue-refund.service";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Hybrid: the server prefetches the list; the client polls while a refund is processing and runs approvals. */
export default async function RevenueRefundsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_REFUND")) return <AccessDenied />;

  const filter = parseRefundSearchParams(await searchParams);
  // Kỳ mặc định "7 ngày gần nhất" tính từ hôm nay giờ VN; đưa xuống client để hai phía cùng một khoá query.
  const today = vnToday();
  const query = toRefundQuery(filter, today);
  const [state, choices] = await Promise.all([
    prefetchDehydrated(async (client) => {
      await Promise.all([
        client.prefetchQuery({
          ...revenueRefundQueries.list(filter, today),
          queryFn: async () => unwrapOrRedirect(await listRevenueRefunds(query)),
        }),
        client.prefetchQuery({
          ...revenueRefundQueries.summary(filter, today),
          queryFn: async () => unwrapOrRedirect(await getRevenueRefundSummary(query)),
        }),
      ]);
    }),
    listSubMerchantChoices(user),
  ]);
  // Names only label the rows; without them each row falls back to a generic label.
  const subNames = choices.success ? Object.fromEntries(choices.data.map((choice) => [choice.id, choice.label])) : {};

  return (
    <HydrationBoundary state={state}>
      <RevenueRefundsContainer
        filter={filter}
        today={today}
        canApprove={hasPermission(user.permissions, "APPROVE_REFUND")}
        canCreate={hasPermission(user.permissions, "CREATE_REFUND")}
        canCancelAny={hasPermission(user.permissions, "CANCEL_REFUND") || hasPermission(user.permissions, "APPROVE_REFUND")}
        userId={user.userId}
        subNames={subNames}
      />
    </HydrationBoundary>
  );
}
