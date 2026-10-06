import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { getServerSession } from "@/lib/auth/session";
import { hasPermission } from "@/features/auth/permissions";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { listUsers as getUsersOnServer } from "@/server/modules/users/user.service";
import { parseUserSearchParams, userQueries } from "@/features/users/user-queries";
import { UserContainer } from "@/features/users/components/UserContainer";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function UsersPage({ searchParams }: Props) {
  const session = await getServerSession();
  if (!session) redirect("/api/v1/admin/auth/session-expired");
  if (!hasPermission(session.permissions, "MANAGE_USER")) {
    return <AccessDenied />;
  }
  const filter = parseUserSearchParams(await searchParams, session.merchantIds);
  const merchantId = filter.merchantId ?? session.merchantIds[0];
  if (!merchantId) {
    return <AccessDenied />;
  }
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...userQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await getUsersOnServer({
        ...filter,
        merchantId,
        page: filter.page,
      })),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <UserContainer filter={filter} merchantIds={session.merchantIds} actorId={session.userId} />
    </HydrationBoundary>
  );
}
