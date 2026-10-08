import { describe, expect, it } from 'vitest';
import { PERMISSION_LABELS } from '../../constants/permission-labels';
import { buildPermissionCoverage, formatGroupDate, getInitials } from '../permission-coverage';

const catalog = [
  { code: 'VIEW_TRANSACTION', category: 'TRANSACTION' },
  { code: 'EXPORT_TRANSACTION', category: 'TRANSACTION' },
  { code: 'VIEW_REFUND', category: 'REFUND' },
  { code: 'VIEW_ORDER', category: 'ORDER' },
];

describe('buildPermissionCoverage', () => {
  it('counts against the real catalog and lists only categories that have granted permissions', () => {
    const coverage = buildPermissionCoverage(catalog, ['VIEW_TRANSACTION', 'VIEW_ORDER']);
    expect(coverage.total).toBe(4);
    expect(coverage.granted).toBe(2);
    expect(coverage.rows.map((row) => [row.label, row.granted.length, row.total])).toEqual([
      ['Giao dịch', 1, 2],
      ['Đơn hàng', 1, 1],
    ]);
    expect(coverage.rows[0]?.granted).toEqual([PERMISSION_LABELS.VIEW_TRANSACTION]);
    expect(coverage.emptyLabels).toEqual(['Hoàn tiền']);
  });

  it('has no empty categories for a system group that owns every permission', () => {
    const coverage = buildPermissionCoverage(catalog, catalog.map((item) => item.code));
    expect(coverage.granted).toBe(coverage.total);
    expect(coverage.emptyLabels).toEqual([]);
    expect(coverage.rows).toHaveLength(3);
  });

  it('keeps permissions unknown to the catalog visible under a separate category', () => {
    const coverage = buildPermissionCoverage(catalog, ['NEW_THING']);
    expect(coverage.rows.map((row) => row.label)).toEqual(['Khác']);
    expect(coverage.rows[0]?.granted).toEqual(['NEW_THING']);
  });
});

describe('getInitials', () => {
  it('uses the first letters of the first two words', () => {
    expect(getInitials('Quản lý tổng')).toBe('QL');
    expect(getInitials('CSKH')).toBe('C');
    expect(getInitials('  ')).toBe('?');
  });
});

describe('formatGroupDate', () => {
  it('returns null for missing or invalid values', () => {
    expect(formatGroupDate(null)).toBeNull();
    expect(formatGroupDate('not a date')).toBeNull();
  });

  it('formats as HH:mm, dd/MM/yyyy', () => {
    expect(formatGroupDate('2026-10-01T17:14:00')).toBe('17:14, 01/10/2026');
  });
});
