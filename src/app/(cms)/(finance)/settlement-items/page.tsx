import type { ReactNode } from "react";
import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getRouteTitle } from "@/app/(cms)/_layout/constants/route.constants";
import { PageHeader } from "@/components/page/PageHeader";
import { ServerResultState } from "@/components/page/ServerResultState";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { hasPermission } from "@/features/auth/permissions";
import { SettlementItemsContainer } from "@/features/settlement-items/components/SettlementItemsContainer";
import { parseSettlementSearchParams, settlementItemQueries } from "@/features/settlement-items/settlement-item-queries";
import { pickSubMerchantId } from "@/features/sub-merchants/utils/sub-merchant-choice";
import { getServerSession } from "@/lib/auth/session";
import { domainErrorMessage } from "@/lib/be/errors";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { readSettlementList } from "@/server/modules/settlement-items/settlement-list";
import { listSubMerchantChoices } from "@/server/modules/sub-merchants/sub-merchant-choices";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Hybrid: the server prefetches the first page; the client owns paging, the range and the detail sheet. */
export default async function SettlementItemsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(user.permissions, "VIEW_BALANCE")) return <AccessDenied />;

  const [parsed, choices] = await Promise.all([searchParams.then((raw) => parseSettlementSearchParams(raw)), listSubMerchantChoices(user)]);
  const title = getRouteTitle("/settlement-items");
  if (!choices.success) {
    return <Empty title={title}><ServerResultState state="error" message={domainErrorMessage(choices.error)} /></Empty>;
  }
  const subMerchantId = pickSubMerchantId(choices.data, parsed.subMerchantId);
  if (!subMerchantId) {
    return <Empty title={title}><ServerResultState state="empty" message="Chưa có Sub-merchant nào để xem dòng quyết toán." /></Empty>;
  }

  const filter = { ...parsed, subMerchantId };
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...settlementItemQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await readSettlementList(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <SettlementItemsContainer filter={filter} choices={choices.data} />
    </HydrationBoundary>
  );
}

function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} />
      {children}
    </div>
  );
}
