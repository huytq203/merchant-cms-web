import type { z } from 'zod';
import type { auditActorTypeSchema, auditCategorySchema, auditFilterSchema, auditLogSchema, auditPeriodSchema } from './schemas';

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditFilter = z.infer<typeof auditFilterSchema>;
export type AuditPeriod = z.infer<typeof auditPeriodSchema>;
export type AuditCategory = z.infer<typeof auditCategorySchema>;
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;

export interface AuditListResult {
  rows: AuditLog[];
  total: number;
}
