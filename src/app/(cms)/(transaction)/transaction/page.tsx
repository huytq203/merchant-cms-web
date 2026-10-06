import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { SampleDataBanner } from "@/features/sample-data/components/SampleDataBanner";
import { TransactionsContainer } from "@/features/transactions/components/TransactionsContainer";
import { parseTransactionSearchParams, transactionQueries } from "@/features/transactions/transaction-queries";
import { resolveModuleSource } from "@/lib/be/api-mode";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listTransactions } from "@/server/modules/transactions/transaction.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TransactionsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const merchantId = user.merchantIds[0];
  if (!merchantId || !hasPermission(user.permissions, "VIEW_TRANSACTION")) {
    return <AccessDenied />;
  }
  const filter = parseTransactionSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...transactionQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listTransactions({ ...filter, merchantId })),
    });
  });
  const abilities = {
    canRefund: hasPermission(user.permissions, "CREATE_REFUND"),
    canDispute: hasPermission(user.permissions, "CREATE_DISPUTE"),
    canExport: hasPermission(user.permissions, "EXPORT_TRANSACTION"),
  };
  const isFixture = resolveModuleSource("transactions") === "fixture";
  return (
    <div className="space-y-5">
      {isFixture && <SampleDataBanner />}
      <HydrationBoundary state={state}>
        <TransactionsContainer filter={filter} abilities={abilities} showSubMerchantFilter={!isFixture} />
      </HydrationBoundary>
    </div>
  );
}
