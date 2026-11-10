import { z } from 'zod';

export const auditActionSchema = z.enum([
  'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK',
  'TERMINATE', 'VIEW_DOCUMENT', 'RESET_PASSWORD', 'GRANT_PERMISSION', 'EXPORT',
]);

/** Người thực hiện theo BE (10/11/2026): admin FlexPay luôn là FLEXPAY, tên đã che thành "FlexPay". */
export const auditActorTypeSchema = z.enum(['MERCHANT', 'FLEXPAY', 'SYSTEM']);

/** Nhóm đối tượng BE map từ entityName; cũng là tham số lọc `category`. */
export const auditCategorySchema = z.enum([
  'MERCHANT', 'SUB_MERCHANT', 'TERMINAL', 'ORDER', 'WITHDRAWAL', 'BANK_ACCOUNT', 'USER',
  'PERMISSION_GROUP', 'REFUND', 'COMPLAINT', 'ESCROW', 'FREEZE', 'CONFIG',
]);

/** Kỳ xem nhật ký: 7 ngày (mặc định), 30 ngày, hoặc tự chọn ngày (rỗng = mọi thời điểm). */
export const auditPeriodSchema = z.enum(['7d', '30d', 'custom']);

const localDateTimeSchema = z.iso.datetime({ local: true, offset: false });

export const auditLogSchema = z.object({
  id: z.uuid(),
  entityName: z.string().nullable(),
  entityId: z.uuid().nullable(),
  /** Thiếu ở BE cũ; null khi entity chưa có nhóm. */
  category: auditCategorySchema.nullish(),
  action: auditActionSchema,
  reason: z.string().nullable(),
  occurredAt: z.string(),
  actorType: auditActorTypeSchema,
  actorLabel: z.string(),
  /** Tên hiển thị mới; BE cũ chỉ có actorLabel. */
  actorDisplayName: z.string().optional(),
});

export const auditFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  period: auditPeriodSchema.optional(),
  actorUsername: z.string().trim().max(100).optional(),
  actorType: auditActorTypeSchema.optional(),
  category: auditCategorySchema.optional(),
  action: auditActionSchema.optional(),
  entityName: z.string().trim().max(100).optional(),
  entityId: z.uuid().optional(),
  occurredFrom: localDateTimeSchema.optional(),
  occurredTo: localDateTimeSchema.optional(),
}).refine((value) => !value.occurredFrom || !value.occurredTo || value.occurredFrom <= value.occurredTo, {
  path: ['occurredTo'],
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
});
