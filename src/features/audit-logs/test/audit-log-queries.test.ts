import { describe, expect, it } from 'vitest';
import { parseAuditSearchParams, presetRange } from '../audit-log-queries';

describe('audit URL filters', () => {
  it('defaults to the last seven days on a first visit', () => {
    const now = new Date('2026-10-05T05:00:00Z'); // 12:00 ngày 05/10 giờ VN
    expect(parseAuditSearchParams({}, now)).toMatchObject({
      period: '7d',
      occurredFrom: '2026-09-29T00:00:00',
      occurredTo: '2026-10-05T23:59:59',
    });
  });

  it('recomputes a preset period from now and ignores stale dates in the URL', () => {
    const now = new Date('2026-11-10T02:00:00Z'); // 09:00 ngày 10/11 giờ VN
    expect(parseAuditSearchParams({ period: '30d', occurredFrom: '2020-01-01T00:00:00' }, now)).toMatchObject({
      period: '30d',
      occurredFrom: '2026-10-12T00:00:00',
      occurredTo: '2026-11-10T23:59:59',
    });
  });

  // Lỗi 11/11: server Vercel chạy UTC, 18:08Z = 01:08 ngày 11/11 VN. Kỳ phải tính theo ngày VN, nếu không
  // occurredTo (giờ UTC) bị BE hiểu là giờ VN và log của 7 tiếng gần nhất bị loại.
  it('computes presets on the Vietnam calendar day, whatever the server time zone', () => {
    const now = new Date('2026-11-10T18:08:00Z');
    expect(parseAuditSearchParams({}, now)).toMatchObject({
      period: '7d',
      occurredFrom: '2026-11-05T00:00:00',
      occurredTo: '2026-11-11T23:59:59',
    });
    expect(presetRange('30d', now)).toEqual({ occurredFrom: '2026-10-13T00:00:00', occurredTo: '2026-11-11T23:59:59' });
  });

  it('keeps the dates of a custom period', () => {
    expect(parseAuditSearchParams({ period: 'custom', occurredFrom: '2026-10-01T00:00:00', occurredTo: '2026-10-03T23:59:59' }))
      .toMatchObject({ period: 'custom', occurredFrom: '2026-10-01T00:00:00', occurredTo: '2026-10-03T23:59:59' });
  });

  it('reads the category and actor type filters', () => {
    expect(parseAuditSearchParams({ category: 'REFUND', actorType: 'FLEXPAY' }))
      .toMatchObject({ category: 'REFUND', actorType: 'FLEXPAY' });
  });

  it('keeps valid URL filters and rejects reversed dates', () => {
    const filter = parseAuditSearchParams({
      actorUsername: 'alice', action: 'LOCK', entityName: 'terminals', category: 'NOPE',
      occurredFrom: '2026-10-06T00:00:00', occurredTo: '2026-10-05T00:00:00',
    });
    expect(filter).toMatchObject({ actorUsername: 'alice', action: 'LOCK', entityName: 'terminals', period: '7d' });
    expect(filter.category).toBeUndefined();
    expect(filter.occurredFrom! <= filter.occurredTo!).toBe(true);
  });

  it('does not refill the dates once the URL carries any search parameter', () => {
    const filter = parseAuditSearchParams({ page: '1', pageSize: '10' });
    expect(filter.period).toBe('custom');
    expect(filter.occurredFrom).toBeUndefined();
    expect(filter.occurredTo).toBeUndefined();
  });

  it('allows one date to be removed while the other stays', () => {
    const filter = parseAuditSearchParams({ occurredFrom: '2026-10-01T00:00:00' });
    expect(filter.occurredFrom).toBe('2026-10-01T00:00:00');
    expect(filter.occurredTo).toBeUndefined();
  });
});
