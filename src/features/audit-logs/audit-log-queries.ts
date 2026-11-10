import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/http/api-client';
import { shiftVnDate, vnToday } from '@/lib/utils/vn-time';
import { auditFilterSchema, auditLogSchema, auditPeriodSchema } from './schemas';
import type { AuditFilter, AuditListResult, AuditLog, AuditPeriod } from './types';

type RawSearchParams = Record<string, string | string[] | undefined>;
const listResultSchema = z.object({ rows: z.array(auditLogSchema), total: z.number().int().min(0) });

const filterParamNames = [
  'page', 'pageSize', 'period', 'actorUsername', 'actorType', 'category', 'action', 'entityName', 'entityId',
  'occurredFrom', 'occurredTo',
] as const;

/** Số ngày lùi của các kỳ có sẵn; "custom" lấy ngày từ URL. */
const presetDays: Record<Exclude<AuditPeriod, 'custom'>, number> = { '7d': 7, '30d': 30 };

function toPositiveInteger(value: string | undefined, fallback: number, max = Infinity): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= max ? parsed : fallback;
}

/**
 * Khoảng thời gian của một kỳ có sẵn, tính lại mỗi lần đọc URL. BE hiểu `occurredFrom/To` là giờ Việt Nam không kèm
 * múi giờ, còn server Vercel chạy UTC: nếu lấy giờ hiện tại của server thì `occurredTo` chậm 7 tiếng và log mới
 * nhất bị loại. Vì vậy tính theo NGÀY lịch Việt Nam: từ 00:00 của (hôm nay - (n-1)) đến 23:59:59 hôm nay.
 */
export function presetRange(period: Exclude<AuditPeriod, 'custom'>, now = new Date()) {
  const today = vnToday(now);
  return { occurredFrom: `${shiftVnDate(today, 1 - presetDays[period])}T00:00:00`, occurredTo: `${today}T23:59:59` };
}

/**
 * Kỳ của URL: có `period` thì theo nó; lần đầu vào màn (URL trống) là 7 ngày (chốt 10/11/2026); URL có tham số
 * khác mà không có `period` (link cũ, hoặc sau "Xóa lọc") là tự chọn - ngày nào có thì lọc theo ngày đó.
 */
function periodOf(raw: string | undefined, firstVisit: boolean): AuditPeriod {
  const parsed = auditPeriodSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return firstVisit ? '7d' : 'custom';
}

export function parseAuditSearchParams(raw: RawSearchParams, now = new Date()): AuditFilter {
  const params = Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  const firstVisit = filterParamNames.every((name) => raw[name] === undefined);
  const period = periodOf(params.period, firstVisit);
  const range = period === 'custom'
    ? { occurredFrom: params.occurredFrom || undefined, occurredTo: params.occurredTo || undefined }
    : presetRange(period, now);
  const candidate = {
    page: toPositiveInteger(params.page, 1),
    pageSize: toPositiveInteger(params.pageSize, 10, 100),
    period,
    actorUsername: params.actorUsername || undefined,
    actorType: params.actorType || undefined,
    category: params.category || undefined,
    action: params.action || undefined,
    entityName: params.entityName || undefined,
    entityId: params.entityId || undefined,
    ...range,
  };
  const parsed = auditFilterSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  // URL hỏng (ngày ngược, enum lạ...): giữ các lọc còn hợp lệ, quay về 7 ngày.
  const keep = <K extends 'actorType' | 'category' | 'action'>(key: K) =>
    params[key] && auditFilterSchema.safeParse({ [key]: params[key] }).success ? { [key]: params[key] as AuditFilter[K] } : {};
  return {
    page: candidate.page,
    pageSize: candidate.pageSize,
    period: '7d',
    ...presetRange('7d', now),
    ...(params.actorUsername ? { actorUsername: params.actorUsername } : {}),
    ...keep('actorType'),
    ...keep('category'),
    ...keep('action'),
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
