import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { RefundsContainer } from "@/features/refund/components/RefundsContainer";
import {
  parseRefundSearchParams,
  refundQueries,
} from "@/features/refund/refund-queries";
import { SampleDataBanner } from "@/features/sample-data/components/SampleDataBanner";
import { resolveModuleSource } from "@/lib/be/api-mode";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listRefunds } from "@/server/modules/refund/refund.service";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RefundPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const merchantId = user.merchantIds[0];
  if (!merchantId || !hasPermission(user.permissions, "VIEW_REFUND")) {
    return <AccessDenied />;
  }
  const filter = parseRefundSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...refundQueries.list(filter),
      queryFn: async () =>
        unwrapOrRedirect(await listRefunds({ ...filter, merchantId })),
    });
  });
  const abilities = {
    canCancel: hasPermission(user.permissions, "CANCEL_REFUND"),
  };
  const isFixture = resolveModuleSource("refund") === "fixture";
  return (
    <div className="space-y-5">
      {isFixture && <SampleDataBanner />}
      <HydrationBoundary state={state}>
        <RefundsContainer
          filter={filter}
          abilities={abilities}
          showSubMerchantFilter={!isFixture}
        />
      </HydrationBoundary>
    </div>
  );
}
