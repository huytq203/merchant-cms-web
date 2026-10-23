import type { z } from "zod";
import type { markAllReadResultSchema, notificationFilterSchema, notificationSchema, unreadCountSchema } from "./schemas";

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationFilter = z.infer<typeof notificationFilterSchema>;
export type UnreadCount = z.infer<typeof unreadCountSchema>;
export type MarkAllReadResult = z.infer<typeof markAllReadResultSchema>;

/** BFF list shape, same as the other list routes: rows of the page and the overall total. */
export interface NotificationListResult {
  rows: Notification[];
  total: number;
}
