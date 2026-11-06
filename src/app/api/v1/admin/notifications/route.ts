import { NextResponse } from "next/server";
import { notificationFilterSchema } from "@/features/notifications/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { toNotificationResponse } from "@/server/modules/notifications/notification-response";
import { listNotifications } from "@/server/modules/notifications/notification.service";

/** The inbox of the signed-in user: no permission code, only a session. */
export async function GET(request: Request) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const query = notificationFilterSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  return toNotificationResponse(await listNotifications(query.data));
}
