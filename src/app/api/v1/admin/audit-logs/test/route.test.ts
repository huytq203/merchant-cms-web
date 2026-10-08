import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSession, listAuditLogs } = vi.hoisted(() => ({ getServerSession: vi.fn(), listAuditLogs: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getServerSession }));
vi.mock('@/server/modules/audit-logs/audit-log.service', () => ({ listAuditLogs }));
import { GET } from '../route';

const request = (query = '') => new Request(`http://localhost/api/v1/admin/audit-logs${query}`);
const row = { id: 'e13ff927-d5d5-4966-ac07-502f2660487c', actorLabel: 'alice' };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ['VIEW_AUDIT_LOG'], merchantIds: ['merchant-one'] });
});

describe('audit collection route', () => {
  it('denies access without permission before calling BE', async () => {
    getServerSession.mockResolvedValue({ permissions: [], merchantIds: ['merchant-one'] });
    expect((await GET(request())).status).toBe(403);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });

  it('rejects reversed dates', async () => {
    expect((await GET(request('?occurredFrom=2026-10-05T12:00:00&occurredTo=2026-10-04T12:00:00'))).status).toBe(400);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });

  it('returns rows and total from the service', async () => {
    listAuditLogs.mockResolvedValue({ success: true, data: { rows: [row], total: 1 } });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rows: [row], total: 1 });
  });

  it('does not accept actorId as a filter', async () => {
    listAuditLogs.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
    await GET(request('?actorId=e13ff927-d5d5-4966-ac07-502f2660487c&actorUsername=alice'));
    expect(listAuditLogs).toHaveBeenCalledWith(expect.not.objectContaining({ actorId: expect.anything() }));
    expect(listAuditLogs).toHaveBeenCalledWith(expect.objectContaining({ actorUsername: 'alice' }));
  });
});
