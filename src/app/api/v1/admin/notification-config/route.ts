import { NextResponse } from "next/server";
import { notificationConfigQuerySchema } from "@/features/notification-settings/schemas";
import { domainErrorMessage, toDomainHttpStatus } from "@/lib/be/errors";
import { requirePermission } from "@/server/auth/require-permission";
import { getNotificationConfig } from "@/server/modules/notification-config/notification-config.service";

/** Cấu hình thông báo hiệu lực cho hộp thoại "Cài đặt thông báo" (chỉ đọc); phạm vi do BE kiểm. */
export async function GET(request: Request) {
  const access = await requirePermission("MANAGE_NOTIFICATION");
  if (!access.ok) return access.response;
  const query = notificationConfigQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? "Tham số không hợp lệ" }, { status: 400 });
  }
  const result = await getNotificationConfig(query.data.subMerchantId);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
