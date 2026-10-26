import type { z } from "zod";
import type {
  notificationFilterSchema,
  notificationListResultSchema,
  notificationSchema,
  readAllResultSchema,
  unreadCountSchema,
} from "./schemas";

export type Notification = z.infer<typeof notificationSchema>;
export type UnreadCount = z.infer<typeof unreadCountSchema>;
export type ReadAllResult = z.infer<typeof readAllResultSchema>;
export type NotificationListResult = z.infer<typeof notificationListResultSchema>;
export type NotificationFilter = z.output<typeof notificationFilterSchema>;
