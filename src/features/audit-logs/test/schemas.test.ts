import { describe, expect, it } from 'vitest';
import { auditFilterSchema, auditLogSchema } from '../schemas';

const entry = {
  id: 'e13ff927-d5d5-4966-ac07-502f2660487c',
  entityName: 'sub_merchants',
  entityId: null,
  action: 'UPDATE',
  reason: null,
  occurredAt: '2026-10-05T12:00:00',
  actorType: 'MERCHANT',
  actorLabel: 'alice',
};

describe('audit schemas', () => {
  it('rejects a reversed time range', () => {
    expect(auditFilterSchema.safeParse({ occurredFrom: '2026-10-05T12:00:00', occurredTo: '2026-10-04T12:00:00' }).success).toBe(false);
  });

  it('accepts the portal DTO and drops fields the BE no longer owns', () => {
    const parsed = auditLogSchema.parse({ ...entry, ipAddress: '10.0.0.1', oldData: '{"a":1}' });
    expect(parsed.actorLabel).toBe('alice');
    expect(parsed).not.toHaveProperty('ipAddress');
    expect(parsed).not.toHaveProperty('oldData');
  });

  it('rejects an unknown actor type', () => {
    expect(auditLogSchema.safeParse({ ...entry, actorType: 'USER' }).success).toBe(false);
  });

  it('accepts a FlexPay row with its category and display name (BE 10/11/2026)', () => {
    const parsed = auditLogSchema.parse({
      ...entry, actorType: 'FLEXPAY', actorLabel: 'FlexPay', actorDisplayName: 'FlexPay', category: 'SUB_MERCHANT',
    });
    expect(parsed.actorType).toBe('FLEXPAY');
    expect(parsed.category).toBe('SUB_MERCHANT');
  });

  it('accepts the new filters and rejects unknown values', () => {
    expect(auditFilterSchema.safeParse({ category: 'REFUND', actorType: 'SYSTEM', period: '30d' }).success).toBe(true);
    expect(auditFilterSchema.safeParse({ category: 'WALLET' }).success).toBe(false);
    expect(auditFilterSchema.safeParse({ actorType: 'ADMIN' }).success).toBe(false);
    expect(auditFilterSchema.safeParse({ period: '90d' }).success).toBe(false);
  });
});
