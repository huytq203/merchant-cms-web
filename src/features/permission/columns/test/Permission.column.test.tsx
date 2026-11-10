// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PermissionGroupNameCell } from '../Permission.column';

afterEach(cleanup);

const group = { id: '11111111-1111-4111-8111-111111111111', merchantId: null, name: 'Vận hành', system: false, permissions: [], createdAt: null };

describe('PermissionGroupNameCell', () => {
  it('shows the group code under the name when the BE sends it', () => {
    render(<PermissionGroupNameCell group={{ ...group, code: 'OPS' }} />);
    expect(screen.getByText('Vận hành')).toBeTruthy();
    expect(screen.getByText('OPS')).toBeTruthy();
  });

  it('shows only the name when an older BE sends no code', () => {
    const { container } = render(<PermissionGroupNameCell group={group} />);
    expect(container.textContent).toBe('Vận hành');
  });
});
