import { describe, expect, it } from 'vitest';
import { buildPermissionGroupUrl } from './permission-group-url';

describe('buildPermissionGroupUrl', () => {
  it('keeps only pagination when there is no filter', () => {
    expect(buildPermissionGroupUrl('/permissions', { page: 2, pageSize: 20 }))
      .toBe('/permissions?page=2&pageSize=20');
  });

  it('adds keyword and both systemOnly values', () => {
    const url = (systemOnly: boolean) => buildPermissionGroupUrl(
      '/permissions',
      { page: 1, pageSize: 10, query: 'kế toán', systemOnly },
    );
    expect(url(false)).toContain('systemOnly=false');
    expect(url(true)).toContain('systemOnly=true');
    expect(url(true)).toContain('keyword=');
  });
});
