import { useQuery } from "@tanstack/react-query";
import { notificationQueries } from "../notification-queries";
import type { UnreadCount } from "../types";

const EMPTY: UnreadCount = { count: 0, byCategory: { PAYMENT: 0, WITHDRAWAL: 0, OTHER: 0 } };

/** Tổng và số theo từng nhóm; toàn 0 khi đang tải hoặc BE từ chối, để lỗi không hiện nhầm huy hiệu. */
export function useUnreadSummary(): UnreadCount {
  const { data } = useQuery(notificationQueries.unreadCount());
  return data ?? EMPTY;
}

/** The number on the bell. */
export function useUnreadCount(): number {
  return useUnreadSummary().count;
}
