import { describe, expect, it } from 'vitest';
import {
  isDuplicateGroupCodeError,
  isValidGroupCode,
  toPermissionGroupCode,
} from '../permission-group-code';

describe('toPermissionGroupCode', () => {
  it('removes Vietnamese diacritics and upper-cases', () => {
    expect(toPermissionGroupCode('Quản trị merchant')).toBe('QUAN_TRI_MERCHANT');
  });

  it('maps đ and Đ to D', () => {
    expect(toPermissionGroupCode('Đối soát đơn')).toBe('DOI_SOAT_DON');
  });

  it('turns every run of other characters into one underscore and trims the ends', () => {
    expect(toPermissionGroupCode('  --Thu   ngân!! & kế/toán ')).toBe('THU_NGAN_KE_TOAN');
  });

  it('keeps digits', () => {
    expect(toPermissionGroupCode('Ca 2 sáng')).toBe('CA_2_SANG');
  });

  it('returns an empty code for blank or symbol-only names', () => {
    expect(toPermissionGroupCode('')).toBe('');
    expect(toPermissionGroupCode('  ')).toBe('');
    expect(toPermissionGroupCode('***')).toBe('');
  });

  it('never exceeds 50 characters and never ends with an underscore', () => {
    const code = toPermissionGroupCode('Nhóm quyền dành cho nhân viên kế toán chi nhánh miền trung phụ trách');
    expect(code.length).toBeLessThanOrEqual(50);
    expect(code.endsWith('_')).toBe(false);
    expect(code.startsWith('NHOM_QUYEN_DANH_CHO')).toBe(true);
  });
});

describe('isValidGroupCode', () => {
  it('follows the backend rule: letter first, then letters, digits or underscore, 2 to 50 characters', () => {
    expect(isValidGroupCode('THU_NGAN')).toBe(true);
    expect(isValidGroupCode('A1')).toBe(true);
    expect(isValidGroupCode('A')).toBe(false);
    expect(isValidGroupCode('2CA')).toBe(false);
    expect(isValidGroupCode('')).toBe(false);
    expect(isValidGroupCode(`A${'B'.repeat(50)}`)).toBe(false);
  });
});

describe('isDuplicateGroupCodeError', () => {
  it('recognises the backend duplicate-code message', () => {
    expect(isDuplicateGroupCodeError('Permission group code already exists')).toBe(true);
  });

  it('ignores other failures', () => {
    expect(isDuplicateGroupCodeError('Không lưu được')).toBe(false);
    expect(isDuplicateGroupCodeError(undefined)).toBe(false);
  });
});
