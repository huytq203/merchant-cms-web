import { describe, expect, it } from 'vitest';
import { actionLabel, entityLabel } from '../audit-mapper';

describe('audit mapper', () => {
  it('falls back to the raw code for unknown actions and entities', () => {
    expect(actionLabel('UNKNOWN_ACTION')).toBe('UNKNOWN_ACTION');
    expect(entityLabel('unknown_table')).toBe('unknown_table');
  });

  it('translates every entity the BE logs for the portal instead of showing the raw code', () => {
    for (const entity of ['merchants', 'sub_merchants', 'terminals', 'merchant_orders', 'merchant_withdrawal_requests', 'merchant_bank_accounts']) {
      expect(entityLabel(entity)).not.toBe(entity);
    }
    expect(actionLabel('LOCK')).not.toBe('LOCK');
  });
});
