import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { BusinessCategory } from "./schemas";

export const businessCategoryQueries = {
  /** Danh mục ngành nghề gần như không đổi trong phiên làm việc, nên giữ cache lâu để các form dùng chung một lần gọi. */
  list: () => queryOptions({
    queryKey: ["business-categories", "list"] as const,
    queryFn: () => apiClient.get<BusinessCategory[]>("/v1/admin/business-categories"),
    staleTime: 10 * 60_000,
  }),
};
