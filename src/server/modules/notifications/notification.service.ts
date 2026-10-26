import "server-only";

import type { BeResult } from "@/lib/be/client";
import { pageSchema } from "@/lib/be/envelope";
import { merchantClient } from "@/lib/be/services";
import { ok } from "@/lib/http/result";
import { notificationSchema, readAllResultSchema, unreadCountSchema } from "@/features/notifications/schemas";
import type {
  Notification,
  NotificationFilter,
  NotificationListResult,
  ReadAllResult,
  UnreadCount,
} from "@/features/notifications/types";
import { notificationPaths } from "./notification.paths";

export async function listNotifications(filter: NotificationFilter): Promise<BeResult<NotificationListResult>> {
  const result = await merchantClient().get({
    path: notificationPaths.list,
    schema: pageSchema(notificationSchema),
    query: { page: filter.page, size: filter.pageSize, unreadOnly: filter.unreadOnly ? true : undefined },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function getUnreadCount(): Promise<BeResult<UnreadCount>> {
  return merchantClient().get({ path: notificationPaths.unreadCount, schema: unreadCountSchema });
}

export function markNotificationRead(id: string): Promise<BeResult<Notification>> {
  return merchantClient().post({ path: notificationPaths.read(id), schema: notificationSchema });
}

export function markAllNotificationsRead(): Promise<BeResult<ReadAllResult>> {
  return merchantClient().post({ path: notificationPaths.readAll, schema: readAllResultSchema });
}
