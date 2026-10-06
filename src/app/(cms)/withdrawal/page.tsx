import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { WithdrawalsContainer } from "@/features/withdrawals/components/WithdrawalsContainer";
import { parseWithdrawalSearchParams, withdrawalQueries } from "@/features/withdrawals/withdrawal-queries";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listWithdrawals } from "@/server/modules/withdrawals/withdrawal.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function WithdrawalPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_WITHDRAWAL")) {
    return <AccessDenied />;
  }
  const filter = parseWithdrawalSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...withdrawalQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listWithdrawals(filter)),
    });
  });
  const abilities = { canCreate: hasPermission(user.permissions, "CREATE_WITHDRAWAL") };
  return (
    <HydrationBoundary state={state}>
      <WithdrawalsContainer filter={filter} abilities={abilities} />
    </HydrationBoundary>
  );
}
