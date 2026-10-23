import "server-only";

import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import type { BeResult } from "@/lib/be/client";
import { markAllReadResultSchema, notificationSchema, unreadCountSchema } from "@/features/notifications/schemas";
import type {
  MarkAllReadResult,
  Notification,
  NotificationFilter,
  NotificationListResult,
  UnreadCount,
} from "@/features/notifications/types";
import { notificationPaths } from "./notification.paths";

/** Newest first is fixed by the BE, so no sort is sent; `page` is 1-based on both sides. */
export async function listNotifications(filter: NotificationFilter): Promise<BeResult<NotificationListResult>> {
  const result = await merchantClient().get({
    path: notificationPaths.list,
    schema: pageSchema(notificationSchema),
    query: { unreadOnly: filter.unreadOnly, page: filter.page, size: filter.pageSize },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function countUnreadNotifications(): Promise<BeResult<UnreadCount>> {
  return merchantClient().get({ path: notificationPaths.unreadCount, schema: unreadCountSchema });
}

/** Idempotent on the BE; a missing id and someone else's id both answer 404. */
export function markNotificationRead(id: string): Promise<BeResult<Notification>> {
  return merchantClient().post({ path: notificationPaths.read(id), schema: notificationSchema });
}

export function markAllNotificationsRead(): Promise<BeResult<MarkAllReadResult>> {
  return merchantClient().post({ path: notificationPaths.readAll, schema: markAllReadResultSchema });
}
