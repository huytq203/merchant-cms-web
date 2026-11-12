import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { hasAnyPermission } from "@/features/auth/permissions";
import { PERMISSION_GATES } from "@/features/auth/permission-gates";
import { AccessDenied } from "@/features/auth/components/access-denied";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { listTerminals } from "@/server/modules/terminals/terminal.service";
import { parseTerminalSearchParams, terminalQueries } from "@/features/terminals/terminal-queries";
import { TerminalsContainer } from "@/features/terminals/components/TerminalsContainer";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TerminalsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  if (!hasAnyPermission(user.permissions, PERMISSION_GATES.terminalRead)) {
    return <AccessDenied />;
  }
  // Sub ngoài phạm vi trên URL do BE bỏ khi giao với phạm vi phiên, nên không chặn cả màn ở đây.
  const filter = parseTerminalSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...terminalQueries.list(filter),
      queryFn: async () => {
        const result = await listTerminals(filter);
        return unwrapOrRedirect(result);
      },
    });
  });
  return (
    <HydrationBoundary state={state}>
      <TerminalsContainer filter={filter} canManage={hasAnyPermission(user.permissions, PERMISSION_GATES.terminalWrite)} />
    </HydrationBoundary>
  );
}
