import { requirePermission } from "@/server/auth/require-permission";
import { toNotificationResponse } from "@/server/modules/notifications/notification-response";
import { markAllNotificationsRead } from "@/server/modules/notifications/notification.service";

export async function POST() {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  return toNotificationResponse(await markAllNotificationsRead());
}
