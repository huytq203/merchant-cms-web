import { describe, expect, it } from 'vitest';
import { parseAuditSearchParams } from './audit-log-queries';

describe('audit URL filters', () => {
  it('defaults to a seven day local range', () => {
    const now = new Date(2026, 9, 5, 12, 0, 0);
    expect(parseAuditSearchParams({}, now)).toMatchObject({
      occurredFrom: '2026-09-28T12:00:00',
      occurredTo: '2026-10-05T12:00:00',
    });
  });

  it('keeps valid URL filters and rejects reversed dates', () => {
    const filter = parseAuditSearchParams({ actorUsername: 'alice', action: 'LOCK', entityName: 'terminals', occurredFrom: '2026-10-06T00:00:00', occurredTo: '2026-10-05T00:00:00' });
    expect(filter).toMatchObject({ actorUsername: 'alice', action: 'LOCK', entityName: 'terminals' });
    expect(filter.occurredFrom! <= filter.occurredTo!).toBe(true);
  });

  it('does not refill the dates once the URL carries any search parameter', () => {
    const filter = parseAuditSearchParams({ page: '1', pageSize: '10' });
    expect(filter.occurredFrom).toBeUndefined();
    expect(filter.occurredTo).toBeUndefined();
  });

  it('allows one date to be removed while the other stays', () => {
    const filter = parseAuditSearchParams({ occurredFrom: '2026-10-01T00:00:00' });
    expect(filter.occurredFrom).toBe('2026-10-01T00:00:00');
    expect(filter.occurredTo).toBeUndefined();
  });
});
