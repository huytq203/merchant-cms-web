import { describe, expect, it } from 'vitest';
import { actionLabel, entityHint, entityLabel } from '../audit-mapper';

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

  // Dòng phụ cột Đối tượng: lý do nếu có, không thì 8 ký tự đầu của entityId để phân biệt các dòng cùng loại.
  it('shows the reason as the entity hint, else the first 8 characters of the entity id', () => {
    const id = '5dcda5e6-1111-4222-8333-444455556666';
    expect(entityHint({ reason: 'Tạo yêu cầu hoàn tiền MRFE1', entityId: id })).toBe('Tạo yêu cầu hoàn tiền MRFE1');
    expect(entityHint({ reason: null, entityId: id })).toBe('5dcda5e6');
    expect(entityHint({ reason: '  ', entityId: id })).toBe('5dcda5e6');
    expect(entityHint({ reason: null, entityId: null })).toBeNull();
  });
});
