import { z } from "zod";
import { MAX_PAGE_SIZE } from "@/lib/schemas/pagination";

/** Nhóm thông báo của BE; mỗi nhóm là một tab trong hộp thư. */
export const NOTIFICATION_CATEGORIES = ["PAYMENT", "WITHDRAWAL", "OTHER"] as const;
export const notificationCategorySchema = z.enum(NOTIFICATION_CATEGORIES);

/**
 * One row of `GET /api/v1/merchant/notifications`; `readAt` is null while the notification is unread.
 * `targetType` is a plain string on purpose: a type the BE adds later must still parse (the row just has no link).
 */
export const notificationSchema = z.object({
  id: z.uuid(),
  type: z.string(),
  /** Nhóm lạ (BE thêm sau) rơi về OTHER thay vì làm hỏng cả danh sách. */
  category: notificationCategorySchema.catch("OTHER"),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  title: z.string(),
  body: z.string(),
  orderId: z.uuid().nullable(),
  subMerchantId: z.uuid().nullable(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

const countSchema = z.number().int().nonnegative();

/** `byCategory` luôn đủ 3 khóa; `count` là tổng, dùng cho tab "Tất cả" và huy hiệu chuông. */
export const unreadCountSchema = z.object({
  count: countSchema,
  byCategory: z.object({ PAYMENT: countSchema, WITHDRAWAL: countSchema, OTHER: countSchema }),
});

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
  /** Bỏ trống = mọi nhóm (tab "Tất cả"); giá trị khác ba nhóm là 400 giống BE. */
  category: z.enum(NOTIFICATION_CATEGORIES, { error: "Nhóm thông báo không hợp lệ." }).optional(),
});

/** Query of the read-all route: `category` limits the update to one tab. */
export const readAllQuerySchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES, { error: "Nhóm thông báo không hợp lệ." }).optional(),
});
