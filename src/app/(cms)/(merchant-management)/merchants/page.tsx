import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { KybContainer } from "@/features/kyb/components/KybContainer";
import { kybQueries } from "@/features/kyb/kyb-queries";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { getMerchant, getMerchantStatusHistory } from "@/server/modules/kyb/kyb.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MerchantsPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/api/v1/admin/auth/session-expired");
  const requested = (await searchParams).merchantId;
  const requestedId = typeof requested === "string" ? requested : undefined;
  if (requestedId && !session.merchantIds.includes(requestedId)) return <AccessDenied />;
  const merchantId = requestedId ?? session.merchantIds[0];
  if (!merchantId) return <AccessDenied />;
  const state = await prefetchDehydrated(async (client) => {
    await Promise.all([
      client.prefetchQuery({
        ...kybQueries.profile(merchantId),
        queryFn: async () => unwrapOrRedirect(await getMerchant(merchantId)),
      }),
      client.prefetchQuery({
        ...kybQueries.history(merchantId, 1),
        queryFn: async () => unwrapOrRedirect(await getMerchantStatusHistory(merchantId, 1)),
      }),
    ]);
  });
  return (
    <HydrationBoundary state={state}>
      <KybContainer merchantId={merchantId} />
    </HydrationBoundary>
  );
}
