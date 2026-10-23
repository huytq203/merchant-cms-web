import { useQuery } from "@tanstack/react-query";
import { notificationQueries } from "../notification-queries";

/** Unread total for the badge; 0 while loading or on error so the badge simply stays hidden. */
export function useUnreadCount() {
  const query = useQuery(notificationQueries.unreadCount());
  return { count: query.data?.count ?? 0, isError: query.isError };
}
