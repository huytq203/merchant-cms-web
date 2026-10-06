import { HydrationBoundary } from '@tanstack/react-query';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { hasPermission } from '@/features/auth/permissions';
import { AccessDenied } from '@/features/auth/components/access-denied';
import { prefetchDehydrated, unwrapOrRedirect } from '@/lib/query/prefetch';
import { listAuditLogs } from '@/server/modules/audit-logs/audit-log.service';
import { auditLogQueries, parseAuditSearchParams } from '@/features/audit-logs/audit-log-queries';
import { AuditLogsContainer } from '@/features/audit-logs/components/AuditLogsContainer';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AuditLogsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect('/api/v1/admin/auth/session-expired');
  if (!hasPermission(user.permissions, 'VIEW_AUDIT_LOG')) {
    return <AccessDenied />;
  }
  const filter = parseAuditSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...auditLogQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listAuditLogs(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <AuditLogsContainer filter={filter} />
    </HydrationBoundary>
  );
}
