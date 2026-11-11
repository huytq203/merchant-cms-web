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
  /** Thiếu ở BE cũ; null khi entity chưa có nhóm; nhóm lạ (BE thêm sau) thành null thay vì làm vỡ cả trang. */
  category: auditCategorySchema.nullish().catch(null),
  action: auditActionSchema,
  reason: z.string().nullable(),
  occurredAt: z.string(),
  /**
   * Giá trị lạ (vd. "ADMIN" của BE cũ) coi là FLEXPAY: FE có thể lên trước BE, một dòng lạ không được làm vỡ cả
   * danh sách, và FLEXPAY là cách hiển thị an toàn nhất (không bao giờ lộ là ai).
   */
  actorType: auditActorTypeSchema.catch('FLEXPAY'),
  actorLabel: z.string(),
  /** Tên hiển thị mới; BE cũ chỉ có actorLabel. */
  actorDisplayName: z.string().optional(),
  /**
   * Tên đối tượng đọc được do BE dựng từ snapshot (11/11/2026), vd "Nguyễn Văn A", "VCB ****0001 – HALOTECH".
   * Thiếu ở BE cũ, null khi BE không dựng được.
   */
  entityDisplayName: z.string().nullish(),
  /**
   * Tóm tắt thay đổi tiếng Việt do BE dựng (11/11/2026), các trường cách nhau bằng "; ", vd
   * "Trạng thái: Đang hoạt động → Đang khóa". BE đã che SĐT/email/số TK; FE hiện nguyên văn.
   */
  changeSummary: z.string().nullish(),
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
