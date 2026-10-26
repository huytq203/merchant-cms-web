import { useQuery } from "@tanstack/react-query";
import { notificationQueries } from "../notification-queries";

/** The number on the menu item; 0 while loading or when the BE refuses, so a failure never shows a wrong badge. */
export function useUnreadCount(): number {
  const { data } = useQuery(notificationQueries.unreadCount());
  return data?.count ?? 0;
}
