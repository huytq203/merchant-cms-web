import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mswServer } from '@/test/msw';
import { getAuditLog, listAuditLogs } from '../audit-log.service';

const path = 'https://merchant.test/api/v1/merchant/audit-logs';
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[]) => ({ content, totalElements: content.length, totalPages: 0, number: 0, size: 10 });

vi.mock('@/lib/auth/session-cookies', () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv('MERCHANT_BASE_URL', 'https://merchant.test');
  vi.stubEnv('IDENTITY_BASE_URL', 'https://identity.test');
});

describe('audit log service', () => {
  it('sends LocalDateTime without timezone and maps empty Page', async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([])));
    }));
    const result = await listAuditLogs({ page: 1, pageSize: 10, occurredFrom: '2026-10-01T00:00:00' });
    expect(result).toEqual({ success: true, data: { rows: [], total: 0 } });
    expect(query?.get('occurredFrom')).toBe('2026-10-01T00:00:00');
    expect(query?.get('occurredFrom')).not.toContain('Z');
  });

  it('sends the BE filters and never a sort field', async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([])));
    }));
    await listAuditLogs({ page: 2, pageSize: 20, actorUsername: 'alice', action: 'LOCK', entityName: 'terminals' });
    expect(Object.fromEntries(query!)).toEqual({ page: '2', size: '20', actorUsername: 'alice', action: 'LOCK', entityName: 'terminals' });
  });

  it('preserves 403 and validates detail', async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: 'Cấm truy cập' }, { status: 403 })));
    expect(await listAuditLogs({ page: 1, pageSize: 10 })).toMatchObject({ success: false, error: { status: 403 } });
    mswServer.use(http.get(`${path}/one`, () => HttpResponse.json(envelope({ id: 'bad' }))));
    expect(await getAuditLog('one')).toMatchObject({ success: false, error: { code: 'INVALID_RESPONSE' } });
  });
});
