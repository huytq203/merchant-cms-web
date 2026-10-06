import { NextResponse } from 'next/server';
import { z } from 'zod';
import { domainErrorMessage, toDomainHttpStatus } from '@/lib/be/errors';
import { requireAuditAccess } from '@/server/modules/audit-logs/require-audit-access';
import { getAuditLog } from '@/server/modules/audit-logs/audit-log.service';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const access = await requireAuditAccess();
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ message: 'Mã nhật ký không hợp lệ' }, { status: 400 });
  }
  const result = await getAuditLog(id);
  return result.success
    ? NextResponse.json(result.data)
    : NextResponse.json({ message: domainErrorMessage(result.error) }, { status: toDomainHttpStatus(result.error) });
}
