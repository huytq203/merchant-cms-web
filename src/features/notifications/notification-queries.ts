import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/http/api-client";
import type { NotificationListResult, UnreadCount } from "./types";

export const NOTIFICATIONS_ENDPOINT = "/v1/admin/notifications";
export const NOTIFICATION_PAGE_SIZE = 20;
export const UNREAD_COUNT_REFRESH_MS = 60_000;

/** One shared prefix, so a single invalidation refreshes the list and the unread count. */
export const NOTIFICATIONS_KEY = ["notifications"] as const;

export const notificationQueries = {
  /** Polls only while the tab is visible (TanStack default), so a hidden tab sends nothing. */
  unreadCount: () => queryOptions({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"] as const,
    queryFn: () => apiClient.get<UnreadCount>(`${NOTIFICATIONS_ENDPOINT}/unread-count`),
    refetchInterval: UNREAD_COUNT_REFRESH_MS,
  }),
  list: (unreadOnly: boolean) => infiniteQueryOptions({
    queryKey: [...NOTIFICATIONS_KEY, "list", { unreadOnly }] as const,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => apiClient.get<NotificationListResult>(NOTIFICATIONS_ENDPOINT, {
      query: { page: pageParam, pageSize: NOTIFICATION_PAGE_SIZE, unreadOnly: unreadOnly ? true : undefined },
    }),
    getNextPageParam: (_last, pages, lastPageParam) => {
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0);
      return loaded < (pages[0]?.total ?? 0) ? lastPageParam + 1 : undefined;
    },
  }),
};
