import { invalidIdResponse } from "@/lib/be/route-id";
import { requirePermission } from "@/server/auth/require-permission";
import { markNotificationRead } from "@/server/modules/notifications/notification.service";
import { notificationResponse } from "@/server/modules/notifications/notification-response";

type Context = { params: Promise<{ id: string }> };

/** Marks one of the caller's notifications read; a non-UUID id is answered 404 before reaching the BE. */
export async function POST(_request: Request, context: Context) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  const invalidId = invalidIdResponse(id);
  if (invalidId) return invalidId;
  return notificationResponse(await markNotificationRead(id));
}
