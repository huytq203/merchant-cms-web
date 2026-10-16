import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { OrdersContainer } from "@/features/orders/components/OrdersContainer";
import { orderQueries, parseOrderSearchParams } from "@/features/orders/order-queries";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listOrders } from "@/server/modules/orders/order.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OrdersPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_ORDER")) {
    return <AccessDenied />;
  }
  const filter = parseOrderSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...orderQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listOrders(filter)),
    });
  });
  const abilities = {
    canCreate: hasPermission(user.permissions, "CREATE_ORDER"),
    canRefund: hasPermission(user.permissions, "CREATE_REFUND"),
    canViewRefunds: hasPermission(user.permissions, "VIEW_REFUND"),
  };
  return (
    <HydrationBoundary state={state}>
      <OrdersContainer filter={filter} abilities={abilities} />
    </HydrationBoundary>
  );
}
