import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import { holdItemPageSchema } from "./schemas";
import type { HoldItemFilter, HoldItemPage } from "./types";

/** Danh sách từng khoản tạm giữ đi qua route Next (kiểm VIEW_HOLD, gắn token) rồi tới BE. */
export const holdCalendarQueries = {
  items: (filter: HoldItemFilter) => queryOptions({
    queryKey: ["hold-calendar", "items", filter] as const,
    queryFn: async (): Promise<HoldItemPage> =>
      holdItemPageSchema.parse(await apiClient.get<unknown>("/v1/admin/hold-calendar/items", { query: { ...filter } })),
    staleTime: 30_000,
  }),
};
