import { queryOptions } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { z } from 'zod';
import { apiClient } from '@/lib/http/api-client';
import { auditFilterSchema, auditLogSchema } from './schemas';
import type { AuditFilter, AuditListResult, AuditLog } from './types';

type RawSearchParams = Record<string, string | string[] | undefined>;
const dateFormat = "yyyy-MM-dd'T'HH:mm:ss";
const listResultSchema = z.object({ rows: z.array(auditLogSchema), total: z.number().int().min(0) });

const filterParamNames = [
  'page', 'pageSize', 'actorUsername', 'action', 'entityName', 'entityId', 'occurredFrom', 'occurredTo',
] as const;

function toPositiveInteger(value: string | undefined, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

/** Defaults to the last seven days only on a first visit; any search parameter means the user chose the range. */
export function parseAuditSearchParams(raw: RawSearchParams, now = new Date()): AuditFilter {
  const defaultFrom = format(subDays(now, 7), dateFormat);
  const defaultTo = format(now, dateFormat);
  const params = Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  const firstVisit = filterParamNames.every((name) => raw[name] === undefined);
  const candidate = {
    page: toPositiveInteger(params.page, 1),
    pageSize: toPositiveInteger(params.pageSize, 10, 100),
    actorUsername: params.actorUsername || undefined,
    action: params.action || undefined,
    entityName: params.entityName || undefined,
    entityId: params.entityId || undefined,
    occurredFrom: params.occurredFrom || (firstVisit ? defaultFrom : undefined),
    occurredTo: params.occurredTo || (firstVisit ? defaultTo : undefined),
  };
  const parsed = auditFilterSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  return {
    page: candidate.page,
    pageSize: candidate.pageSize,
    occurredFrom: defaultFrom,
    occurredTo: defaultTo,
    ...(params.actorUsername ? { actorUsername: params.actorUsername } : {}),
    ...(params.action && auditFilterSchema.safeParse({ action: params.action }).success ? { action: params.action as AuditFilter['action'] } : {}),
    ...(params.entityName ? { entityName: params.entityName } : {}),
  };
}

export const auditLogQueries = {
  list: (filter: AuditFilter) => queryOptions({
    queryKey: ['audit-logs', 'list', filter] as const,
    queryFn: async (): Promise<AuditListResult> => listResultSchema.parse(await apiClient.get<unknown>('/v1/admin/audit-logs', { query: { ...filter } })),
    staleTime: 30_000,
  }),
  detail: (id: string) => queryOptions({
    queryKey: ['audit-logs', 'detail', id] as const,
    queryFn: async (): Promise<AuditLog> => auditLogSchema.parse(await apiClient.get<unknown>(`/v1/admin/audit-logs/${id}`)),
    staleTime: 30_000,
  }),
};
