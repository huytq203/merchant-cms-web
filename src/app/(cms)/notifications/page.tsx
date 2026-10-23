import { HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { prefetchDehydrated, unwrapOrRedirect } from "@/lib/query/prefetch";
import { NotificationList } from "@/features/notifications/components/NotificationList";
import { notificationQueries, parseNotificationSearchParams } from "@/features/notifications/notification-queries";
import { listNotifications } from "@/server/modules/notifications/notification.service";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Personal inbox: any signed-in merchant user may open it (no business permission), so only the
 * session is checked. The current page is prefetched on the server and handed to the client cache.
 */
export default async function NotificationsPage({ searchParams }: Props) {
  const user = await getServerSession();
  if (!user) redirect("/api/v1/admin/auth/session-expired");
  const filter = parseNotificationSearchParams(await searchParams);
  const state = await prefetchDehydrated(async (client) => {
    await client.prefetchQuery({
      ...notificationQueries.list(filter),
      queryFn: async () => unwrapOrRedirect(await listNotifications(filter)),
    });
  });
  return (
    <HydrationBoundary state={state}>
      <NotificationList filter={filter} />
    </HydrationBoundary>
  );
}
