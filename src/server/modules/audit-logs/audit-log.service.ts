import 'server-only';

import { pageSchema } from '@/lib/be/envelope';
import { merchantClient } from '@/lib/be/services';
import { ok } from '@/lib/http/result';
import type { BeResult } from '@/lib/be/client';
import { auditLogSchema } from '@/features/audit-logs/schemas';
import type { AuditFilter, AuditListResult, AuditLog } from '@/features/audit-logs/types';
import { auditLogPaths } from './audit-log.paths';

export async function listAuditLogs(filter: AuditFilter): Promise<BeResult<AuditListResult>> {
  const result = await merchantClient().get({
    path: auditLogPaths.list,
    schema: pageSchema(auditLogSchema),
    query: {
      page: filter.page,
      size: filter.pageSize,
      actorUsername: filter.actorUsername,
      // Lọc portal-only (BE 10/11/2026): nhóm đối tượng và loại người thực hiện MERCHANT/FLEXPAY/SYSTEM.
      actorType: filter.actorType,
      category: filter.category,
      action: filter.action,
      entityName: filter.entityName,
      entityId: filter.entityId,
      occurredFrom: filter.occurredFrom,
      occurredTo: filter.occurredTo,
    },
  });
  return result.success ? ok({ rows: result.data.content, total: result.data.totalElements }) : result;
}

export function getAuditLog(id: string): Promise<BeResult<AuditLog>> {
  return merchantClient().get({ path: auditLogPaths.detail(id), schema: auditLogSchema });
}
