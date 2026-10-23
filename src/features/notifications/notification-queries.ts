import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { apiClient } from "@/lib/http/api-client";
import { notificationFilterSchema, notificationSchema, unreadCountSchema } from "./schemas";
import type { NotificationFilter, NotificationListResult, UnreadCount } from "./types";

type RawSearchParams = Record<string, string | string[] | undefined>;

const listResultSchema = z.object({ rows: z.array(notificationSchema), total: z.number().int().min(0) });

/** The bell polls this often, as the BE handover recommends (the endpoint uses a partial index). */
export const UNREAD_POLL_MS = 30_000;

/** Rows shown in the bell popover; the full inbox lives on `/notifications`. */
export const BELL_PREVIEW_SIZE = 5;

const DEFAULT_FILTER: NotificationFilter = { unreadOnly: false, page: 1, pageSize: 20 };

/** Reads the inbox filter from the URL; any invalid value falls back to its default. */
export function parseNotificationSearchParams(raw: RawSearchParams): NotificationFilter {
  const read = (name: string) => (typeof raw[name] === "string" ? raw[name] : undefined);
  const candidate = {
    unreadOnly: read("unreadOnly") === "true",
    page: Number(read("page") ?? DEFAULT_FILTER.page),
    pageSize: Number(read("pageSize") ?? DEFAULT_FILTER.pageSize),
  };
  return {
    unreadOnly: candidate.unreadOnly,
    page: notificationFilterSchema.shape.page.safeParse(candidate.page).data ?? DEFAULT_FILTER.page,
    pageSize: notificationFilterSchema.shape.pageSize.safeParse(candidate.pageSize).data ?? DEFAULT_FILTER.pageSize,
  };
}

/** Every key starts with `notifications` so one invalidation refreshes the badge and all lists. */
export const notificationKeys = {
  all: ["notifications"] as const,
  lists: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export const notificationQueries = {
  list: (filter: NotificationFilter) => queryOptions({
    queryKey: [...notificationKeys.lists, filter] as const,
    queryFn: async (): Promise<NotificationListResult> =>
      listResultSchema.parse(await apiClient.get<unknown>("/v1/merchant/notifications", { query: { ...filter } })),
    staleTime: 15_000,
  }),
  unreadCount: () => queryOptions({
    queryKey: notificationKeys.unreadCount,
    queryFn: async (): Promise<UnreadCount> =>
      unreadCountSchema.parse(await apiClient.get<unknown>("/v1/merchant/notifications/unread-count")),
    staleTime: 15_000,
    refetchInterval: UNREAD_POLL_MS,
    // Polling pauses while the tab is hidden; TanStack resumes it when the tab is visible again.
    refetchIntervalInBackground: false,
  }),
};
