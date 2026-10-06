import { z } from 'zod';

export const auditActionSchema = z.enum([
  'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK',
  'TERMINATE', 'VIEW_DOCUMENT', 'RESET_PASSWORD', 'GRANT_PERMISSION', 'EXPORT',
]);

export const auditActorTypeSchema = z.enum(['MERCHANT', 'ADMIN', 'SYSTEM']);

const localDateTimeSchema = z.iso.datetime({ local: true, offset: false });

export const auditLogSchema = z.object({
  id: z.uuid(),
  entityName: z.string().nullable(),
  entityId: z.uuid().nullable(),
  action: auditActionSchema,
  reason: z.string().nullable(),
  occurredAt: z.string(),
  actorType: auditActorTypeSchema,
  actorLabel: z.string(),
});

export const auditFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  actorUsername: z.string().trim().max(100).optional(),
  action: auditActionSchema.optional(),
  entityName: z.string().trim().max(100).optional(),
  entityId: z.uuid().optional(),
  occurredFrom: localDateTimeSchema.optional(),
  occurredTo: localDateTimeSchema.optional(),
}).refine((value) => !value.occurredFrom || !value.occurredTo || value.occurredFrom <= value.occurredTo, {
  path: ['occurredTo'],
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
});
