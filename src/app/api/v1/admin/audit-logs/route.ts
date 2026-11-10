import { NextResponse } from 'next/server';
import { paginationQuerySchema } from "@/lib/schemas/pagination";
import { z } from 'zod';
import { auditFilterSchema } from '@/features/audit-logs/schemas';
import { domainErrorMessage, toDomainHttpStatus } from '@/lib/be/errors';
import { requireAuditAccess } from '@/server/modules/audit-logs/require-audit-access';
import { listAuditLogs } from '@/server/modules/audit-logs/audit-log.service';

const querySchema = paginationQuerySchema.extend({
  actorUsername: z.string().optional(),
  actorType: z.string().optional(),
  category: z.string().optional(),
  action: z.string().optional(),
  entityName: z.string().optional(),
  entityId: z.string().optional(),
  occurredFrom: z.string().optional(),
  occurredTo: z.string().optional(),
});

export async function GET(request: Request) {
  const access = await requireAuditAccess();
  if (!access.ok) return access.response;
  const raw = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  const query = raw.success ? auditFilterSchema.safeParse(raw.data) : raw;
  if (!query.success) {
    return NextResponse.json({ message: query.error.issues[0]?.message ?? 'Tham số không hợp lệ' }, { status: 400 });
  }
  const result = await listAuditLogs(query.data);
  if (!result.success) {
    return NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
  }
  return NextResponse.json({ rows: result.data.rows, total: result.data.total });
}
