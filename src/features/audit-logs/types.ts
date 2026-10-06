import type { z } from 'zod';
import type { auditFilterSchema, auditLogSchema } from './schemas';

export type AuditLog = z.infer<typeof auditLogSchema>;
export type AuditFilter = z.infer<typeof auditFilterSchema>;

export interface AuditListResult {
  rows: AuditLog[];
  total: number;
}
