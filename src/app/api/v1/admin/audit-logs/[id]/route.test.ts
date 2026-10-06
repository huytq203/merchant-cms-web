import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSession, getAuditLog } = vi.hoisted(() => ({ getServerSession: vi.fn(), getAuditLog: vi.fn() }));
vi.mock('@/lib/auth/session', () => ({ getServerSession }));
vi.mock('@/server/modules/audit-logs/audit-log.service', () => ({ getAuditLog }));
import { GET } from './route';

const id = 'e13ff927-d5d5-4966-ac07-502f2660487c';
const request = new Request(`http://localhost/api/v1/admin/audit-logs/${id}`);
const context = { params: Promise.resolve({ id }) };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: ['VIEW_AUDIT_LOG'] });
});

describe('audit detail route', () => {
  it('rejects a missing session without calling BE', async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request, context)).status).toBe(401);
    expect(getAuditLog).not.toHaveBeenCalled();
  });

  it('rejects missing permission without calling BE', async () => {
    getServerSession.mockResolvedValue({ permissions: [] });
    expect((await GET(request, context)).status).toBe(403);
    expect(getAuditLog).not.toHaveBeenCalled();
  });

  it('returns the detail from the service', async () => {
    getAuditLog.mockResolvedValue({ success: true, data: { id, actorLabel: 'alice' } });
    const response = await GET(request, context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id, actorLabel: 'alice' });
  });
});
