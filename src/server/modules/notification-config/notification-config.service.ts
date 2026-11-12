import "server-only";

import type { BeResult } from "@/lib/be/client";
import { merchantClient } from "@/lib/be/services";
import { notificationConfigSchema, type NotificationConfig } from "@/features/notification-settings/schemas";

const PATH = "/api/v1/merchant/notification-config";

/**
 * Cấu hình thông báo hiệu lực. Không có `subMerchantId` = cấp Master (BE cần quyền toàn Master);
 * người dùng chỉ được gán Sub phải truyền Sub, nếu không BE trả 404.
 */
export function getNotificationConfig(subMerchantId?: string): Promise<BeResult<NotificationConfig>> {
  return merchantClient().get({ path: PATH, schema: notificationConfigSchema, query: subMerchantId ? { subMerchantId } : undefined });
}
