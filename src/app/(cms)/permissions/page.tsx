import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { prefetchDehydrated, unwrapOrRedirect } from '@/lib/query/prefetch';
import { getServerSession } from '@/lib/auth/session';
import { hasPermission } from '@/features/auth/permissions';
import { AccessDenied } from '@/features/auth/components/access-denied';
import { listPermissionCatalog, listPermissionGroups } from '@/server/modules/permissions/permission.service';
import { parsePermissionGroupSearchParams, permissionGroupQueries } from '@/features/permission/permission-group-queries';
import { PermissionGroupContainer } from '@/features/permission/components/PermissionGroupContainer';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PermissionsPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect('/api/v1/admin/auth/session-expired');
  if (!hasPermission(session.permissions, 'MANAGE_PERMISSION_GROUP')) {
    return <AccessDenied />;
  }
  const merchantId = session.merchantIds[0];
  if (!merchantId) {
    return <AccessDenied />;
  }
  const filter = parsePermissionGroupSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await Promise.all([
      client.prefetchQuery({
        ...permissionGroupQueries.catalog(),
        queryFn: async () => unwrapOrRedirect(await listPermissionCatalog()),
      }),
      client.prefetchQuery({
        ...permissionGroupQueries.list(filter),
        queryFn: async () => unwrapOrRedirect(await listPermissionGroups({ merchantId, ...filter })),
      }),
    ]);
  });
  return (
    <HydrationBoundary state={state}>
      <PermissionGroupContainer filter={filter} />
    </HydrationBoundary>
  );
}
