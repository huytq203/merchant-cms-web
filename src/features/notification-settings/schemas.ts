import { z } from "zod";

/**
 * Kênh ngoài web của một nhóm thông báo: chỉ còn EMAIL (đã bỏ SMS). Kênh lạ, kể cả "SMS" còn sót trong dữ liệu cũ,
 * bị bỏ qua thay vì làm hỏng cả bảng.
 */
const channelSchema = z.enum(["EMAIL"]);

/** Một dòng của bảng 9 nhóm: `emailMandatory` = nhóm bắt buộc gửi email, Admin cũng không tắt được. */
export const notificationConfigRowSchema = z.object({
  kind: z.string(),
  label: z.string(),
  emailMandatory: z.boolean(),
  channels: z.array(z.string()).transform((list) => list.filter((c): c is z.infer<typeof channelSchema> => channelSchema.safeParse(c).success)),
});

/** `GET /api/v1/merchant/notification-config`: cấu hình thông báo HIỆU LỰC, chỉ đọc. */
export const notificationConfigSchema = z.object({
  externalChannelsEnabled: z.boolean(),
  externalChannels: z.array(notificationConfigRowSchema),
  notificationEmails: z.array(z.string()),
});

export const notificationConfigQuerySchema = z.object({
  subMerchantId: z.uuid("Sub-merchant không hợp lệ").optional(),
});

export type NotificationConfig = z.infer<typeof notificationConfigSchema>;
export type NotificationConfigRow = z.infer<typeof notificationConfigRowSchema>;
