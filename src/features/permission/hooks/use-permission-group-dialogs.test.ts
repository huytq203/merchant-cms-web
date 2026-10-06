// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePermissionGroupDialogs } from './use-permission-group-dialogs';
import type { PermissionGroup } from '../schemas/permission-group.schema';

const group: PermissionGroup = {
  id: '11111111-1111-4111-8111-111111111111',
  merchantId: null,
  code: 'ACCOUNTING',
  name: 'Kế toán',
  description: null,
  system: false,
  permissions: ['VIEW_ORDER'],
  createdAt: null,
};

describe('permission group dialogs', () => {
  it('opens create without a target and clears target on close', () => {
    const { result } = renderHook(usePermissionGroupDialogs);
    act(() => result.current.openFor('edit', group));
    expect(result.current.target).toEqual(group);
    act(() => result.current.openCreate());
    expect(result.current.activeDialog).toBe('create');
    expect(result.current.target).toBeNull();
    act(() => result.current.close());
    expect(result.current.activeDialog).toBeNull();
  });
});
