import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { hasAnyPermission, hasPermission } from '@/features/auth/permissions';
import { PERMISSION_GATES } from '@/features/auth/permission-gates';
import { AccessDenied } from '@/features/auth/components/access-denied';
import { prefetchDehydrated, unwrapOrRedirect } from '@/lib/query/prefetch';
import { listSubMerchants } from '@/server/modules/sub-merchants/sub-merchant.service';
import { parseSubMerchantSearchParams, subMerchantQueries } from '@/features/sub-merchants/sub-merchant-queries';
import { SubMerchantsContainer } from '@/features/sub-merchants/components/SubMerchantsContainer';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SubMerchantsPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect('/api/v1/admin/auth/session-expired');
  if (!hasPermission(session.permissions, 'MANAGE_SUB_MERCHANT')) {
    return <AccessDenied />;
  }
  const filter = parseSubMerchantSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...subMerchantQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listSubMerchants(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <SubMerchantsContainer
        filter={filter}
        canLock={hasAnyPermission(session.permissions, PERMISSION_GATES.subMerchantLock)}
        staticQr={{
          canView: hasAnyPermission(session.permissions, PERMISSION_GATES.terminalRead),
          canManage: hasAnyPermission(session.permissions, PERMISSION_GATES.terminalWrite),
        }}
      />
    </HydrationBoundary>
  );
}
