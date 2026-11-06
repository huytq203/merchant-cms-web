import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/schemas/pagination";

/** One row of `GET /api/v1/merchant/notifications`; `readAt` is null while the notification is unread. */
export const notificationSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  orderId: z.uuid().nullable(),
  subMerchantId: z.uuid().nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

export const unreadCountSchema = z.object({ count: z.number().int().nonnegative() });

export const readAllResultSchema = z.object({ updated: z.number().int().nonnegative() });

export const notificationListResultSchema = z.object({
  rows: z.array(notificationSchema),
  total: z.number().int().nonnegative(),
});

/** Query of the list route; `unreadOnly` arrives as the string `true` from the browser. */
export const notificationFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
  unreadOnly: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
});
