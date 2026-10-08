import { describe, expect, it } from 'vitest';
import { MERCHANT_PERMISSIONS } from '@/features/auth/permissions';
import { PERMISSION_LABELS, permissionLabel } from '../permission-labels';

describe('permission labels', () => {
  it.each(MERCHANT_PERMISSIONS)('has a Vietnamese label for %s', (code) => {
    expect(PERMISSION_LABELS[code]).toBeTruthy();
    expect(PERMISSION_LABELS[code]).not.toBe(code);
  });

  it('gives every permission a distinct label', () => {
    const labels = Object.values(PERMISSION_LABELS);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('falls back to the raw code for a permission the FE does not know yet', () => {
    expect(permissionLabel('NEW_BE_PERMISSION')).toBe('NEW_BE_PERMISSION');
  });
});
