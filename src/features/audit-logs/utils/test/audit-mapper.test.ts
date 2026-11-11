import { describe, expect, it } from 'vitest';
import { actionLabel, changeLines, changeText, entityHint, entityLabel } from '../audit-mapper';

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

  // Dòng phụ cột Đối tượng (11/11/2026): tên BE dựng sẵn; BE cũ thì lý do, không nữa thì 8 ký tự đầu entityId.
  it('prefers the readable name from the BE as the entity hint', () => {
    const id = '5dcda5e6-1111-4222-8333-444455556666';
    expect(entityHint({ entityDisplayName: 'VCB ****0001 – HALOTECH', reason: 'Tạo TK', entityId: id }))
      .toBe('VCB ****0001 – HALOTECH');
    expect(entityHint({ entityDisplayName: '  ', reason: null, entityId: id })).toBe('5dcda5e6');
  });

  // Cột/ô Nội dung: tóm tắt thay đổi của BE; dòng không có tóm tắt thì lý do (chỉ có ở thao tác của merchant).
  it('shows the change summary, else the reason, else nothing', () => {
    expect(changeText({ changeSummary: 'Trạng thái: Đang hoạt động → Đang khóa', reason: 'x' }))
      .toBe('Trạng thái: Đang hoạt động → Đang khóa');
    expect(changeText({ changeSummary: null, reason: 'Tạo yêu cầu hoàn tiền MRFE1' })).toBe('Tạo yêu cầu hoàn tiền MRFE1');
    expect(changeText({ changeSummary: ' ', reason: null })).toBeNull();
    expect(changeText({ reason: null })).toBeNull();
  });

  it('splits a summary into one line per changed field for the detail view', () => {
    expect(changeLines('Đề nghị thay đổi – Số tài khoản: ****0001 → ****0003; Tên chủ tài khoản: A → B'))
      .toEqual(['Đề nghị thay đổi – Số tài khoản: ****0001 → ****0003', 'Tên chủ tài khoản: A → B']);
    expect(changeLines(null)).toEqual([]);
  });

  it('shows the reason as the entity hint, else the first 8 characters of the entity id', () => {
    const id = '5dcda5e6-1111-4222-8333-444455556666';
    expect(entityHint({ reason: 'Tạo yêu cầu hoàn tiền MRFE1', entityId: id })).toBe('Tạo yêu cầu hoàn tiền MRFE1');
    expect(entityHint({ reason: null, entityId: id })).toBe('5dcda5e6');
    expect(entityHint({ reason: '  ', entityId: id })).toBe('5dcda5e6');
    expect(entityHint({ reason: null, entityId: null })).toBeNull();
  });
});
