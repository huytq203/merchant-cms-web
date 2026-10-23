import { useMutation, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { notificationKeys } from "../notification-queries";
import type { MarkAllReadResult, Notification, NotificationListResult, UnreadCount } from "../types";

type Snapshot = Array<[QueryKey, unknown]>;

/** Captures the badge and every cached list so a refused request can put them back exactly. */
async function snapshot(client: QueryClient): Promise<Snapshot> {
  await client.cancelQueries({ queryKey: notificationKeys.all });
  return client.getQueriesData({ queryKey: notificationKeys.all });
}

function restore(client: QueryClient, previous: Snapshot | undefined) {
  for (const [key, data] of previous ?? []) client.setQueryData(key, data);
}

/** Applies `mark` to every cached inbox page (bell preview and `/notifications` pages alike). */
function updateCachedRows(client: QueryClient, mark: (row: Notification) => Notification) {
  client.setQueriesData<NotificationListResult>({ queryKey: notificationKeys.lists }, (list) =>
    list ? { ...list, rows: list.rows.map(mark) } : list,
  );
}

function setUnread(client: QueryClient, next: (count: number) => number) {
  client.setQueryData<UnreadCount>(notificationKeys.unreadCount, (current) =>
    current ? { count: Math.max(0, next(current.count)) } : current,
  );
}

/**
 * Marks one notification read. The badge and row change at once (optimistic) and are restored if the
 * BE refuses; afterwards everything under `notifications` is refetched to match the server.
 * An already-read row does not lower the badge: the BE call is idempotent and keeps the first readAt.
 */
export function useMarkRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (notification: Notification) =>
      apiClient.post<Notification>(`/v1/merchant/notifications/${encodeURIComponent(notification.id)}/read`, undefined, { toast: { success: false, error: true } }),
    onMutate: async (notification) => {
      const previous = await snapshot(client);
      if (notification.readAt === null) {
        const readAt = new Date().toISOString();
        updateCachedRows(client, (row) => (row.id === notification.id && row.readAt === null ? { ...row, readAt } : row));
        setUnread(client, (count) => count - 1);
      }
      return { previous };
    },
    onError: (_error, _notification, context) => restore(client, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/** Marks every unread notification read, with the same optimistic update and rollback as {@link useMarkRead}. */
export function useMarkAllRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<MarkAllReadResult>("/v1/merchant/notifications/read-all", undefined, { toast: { success: false, error: true } }),
    onMutate: async () => {
      const previous = await snapshot(client);
      const readAt = new Date().toISOString();
      updateCachedRows(client, (row) => (row.readAt === null ? { ...row, readAt } : row));
      setUnread(client, () => 0);
      return { previous };
    },
    onError: (_error, _variables, context) => restore(client, context?.previous),
    onSettled: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
