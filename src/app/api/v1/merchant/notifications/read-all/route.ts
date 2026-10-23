import { requirePermission } from "@/server/auth/require-permission";
import { markAllNotificationsRead } from "@/server/modules/notifications/notification.service";
import { notificationResponse } from "@/server/modules/notifications/notification-response";

/** Marks every unread notification of the caller read; answers how many rows changed. */
export async function POST() {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  return notificationResponse(await markAllNotificationsRead());
}
