// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { buildPermissionColumns, PermissionGroupNameCell } from '../Permission.column';
import { scopeLevelLabel } from '../../utils/permission-group-mapper';

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

describe('scope level column', () => {
  it('names the level and counts a group without one as Master', () => {
    const columns = buildPermissionColumns({ onView: () => {}, onEdit: () => {}, onDelete: () => {} }, 1, 10);
    expect(columns.find((column) => column.id === 'scopeLevel')?.header).toBe('Cấp quản lý');
    expect(scopeLevelLabel('SUB')).toBe('Cấp Sub');
    expect(scopeLevelLabel('MASTER')).toBe('Cấp Master');
    expect(scopeLevelLabel(undefined)).toBe('Cấp Master');
  });
});
