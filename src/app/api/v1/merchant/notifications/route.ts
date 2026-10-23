import { parseNotificationSearchParams } from "@/features/notifications/notification-queries";
import { requirePermission } from "@/server/auth/require-permission";
import { listNotifications } from "@/server/modules/notifications/notification.service";
import { notificationResponse } from "@/server/modules/notifications/notification-response";

/**
 * The inbox belongs to the signed-in user, so only a session is required (no business permission).
 * Only the known filter keys are read from the URL: a client `userId` is dropped, the BE takes the
 * recipient from the token.
 */
export async function GET(request: Request) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const filter = parseNotificationSearchParams(Object.fromEntries(new URL(request.url).searchParams));
  return notificationResponse(await listNotifications(filter));
}
