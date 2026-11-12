import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { NotificationConfig } from "./schemas";

export const notificationConfigQueries = {
  /** `subMerchantId` trống = cấp Master; mỗi Sub giữ một bản riêng trong cache. */
  effective: (subMerchantId?: string) => queryOptions({
    queryKey: ["notification-config", subMerchantId ?? "master"] as const,
    queryFn: () => apiClient.get<NotificationConfig>("/v1/admin/notification-config", { query: { subMerchantId } }),
  }),
};
