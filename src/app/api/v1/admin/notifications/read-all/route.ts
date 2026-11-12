import { NextResponse } from "next/server";
import { readAllQuerySchema } from "@/features/notifications/schemas";
import { requirePermission } from "@/server/auth/require-permission";
import { toNotificationResponse } from "@/server/modules/notifications/notification-response";
import { markAllNotificationsRead } from "@/server/modules/notifications/notification.service";

/** Marks the inbox read; `?category=` limits it to the open tab. */
export async function POST(request: Request) {
  const access = await requirePermission();
  if (!access.ok) return access.response;
  const query = readAllQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  return toNotificationResponse(await markAllNotificationsRead(query.data.category));
}
