import { requirePermission } from "@/server/auth/require-permission";
import { countUnreadNotifications } from "@/server/modules/notifications/notification.service";
import { notificationResponse } from "@/server/modules/notifications/notification-response";

/** Polled by the header bell; session only, the count is always the caller's own. */
export async function GET() {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  return notificationResponse(await countUnreadNotifications());
}
