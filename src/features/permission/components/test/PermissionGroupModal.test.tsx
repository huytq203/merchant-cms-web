// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PERMISSION_LABELS } from '../../constants/permission-labels';
import type { PermissionCatalogItem, PermissionGroup } from '../../schemas/permission-group.schema';
import { PermissionGroupModal } from '../PermissionGroupModal';

const catalog: PermissionCatalogItem[] = [
  { code: 'VIEW_TRANSACTION', category: 'TRANSACTION' },
  { code: 'EXPORT_TRANSACTION', category: 'TRANSACTION' },
  { code: 'VIEW_REFUND', category: 'REFUND' },
  { code: 'CREATE_REFUND', category: 'REFUND' },
  { code: 'APPROVE_REFUND', category: 'REFUND' },
  { code: 'VIEW_ORDER', category: 'ORDER' },
];
const existing: PermissionGroup = {
  id: '11111111-1111-4111-8111-111111111111',
  merchantId: null,
  code: 'ACCOUNTING',
  name: 'Kế toán',
  description: 'Quản lý kế toán',
  system: false,
  permissions: ['VIEW_ORDER'],
  createdAt: null,
};

afterEach(cleanup);

function renderModal(props: Partial<React.ComponentProps<typeof PermissionGroupModal>> = {}) {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <PermissionGroupModal
      open
      onOpenChange={onOpenChange}
      catalog={catalog}
      isSubmitting={false}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return { onSubmit, onOpenChange };
}

const checkbox = (code: keyof typeof PERMISSION_LABELS) =>
  screen.getByRole('checkbox', { name: PERMISSION_LABELS[code] });
const nameInput = () => screen.getByRole('textbox', { name: /Tên nhóm/ });
const save = () => screen.getByRole('button', { name: 'Lưu nhóm quyền' });

describe('permission picker', () => {
  it('shows only the permissions of the selected category tab', async () => {
    renderModal();
    expect(screen.getByRole('tab', { name: /Giao dịch/ })).toHaveAttribute('aria-selected', 'true');
    expect(checkbox('VIEW_TRANSACTION')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: PERMISSION_LABELS.VIEW_REFUND })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /Hoàn tiền/ }));

    expect(checkbox('VIEW_REFUND')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: PERMISSION_LABELS.VIEW_TRANSACTION })).not.toBeInTheDocument();
  });

  it('counts selected permissions per category and in total against the real catalog size', async () => {
    renderModal();
    await userEvent.click(checkbox('VIEW_TRANSACTION'));

    expect(screen.getByRole('tab', { name: /Giao dịch.*1\/2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Hoàn tiền.*0\/3/ })).toBeInTheDocument();
    expect(screen.getByText('Đã chọn 1/6 quyền')).toBeInTheDocument();
  });

  it('selects and clears a whole category and reports a partial selection as mixed', async () => {
    renderModal();
    const selectAll = () => screen.getByRole('checkbox', { name: /^(Chọn tất cả|Bỏ chọn)$/ });

    await userEvent.click(checkbox('VIEW_TRANSACTION'));
    expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');

    await userEvent.click(selectAll());
    expect(checkbox('VIEW_TRANSACTION')).toBeChecked();
    expect(checkbox('EXPORT_TRANSACTION')).toBeChecked();
    expect(selectAll()).toBeChecked();
    expect(selectAll()).toHaveAccessibleName(/Bỏ chọn/);

    await userEvent.click(selectAll());
    expect(checkbox('VIEW_TRANSACTION')).not.toBeChecked();
    expect(checkbox('EXPORT_TRANSACTION')).not.toBeChecked();
  });

  it('keeps selections made in other categories when switching tabs', async () => {
    renderModal();
    await userEvent.click(checkbox('VIEW_TRANSACTION'));
    await userEvent.click(screen.getByRole('tab', { name: /Hoàn tiền/ }));
    await userEvent.click(checkbox('VIEW_REFUND'));
    await userEvent.click(screen.getByRole('tab', { name: /Giao dịch/ }));

    expect(checkbox('VIEW_TRANSACTION')).toBeChecked();
    expect(screen.getByText('Đã chọn 2/6 quyền')).toBeInTheDocument();
  });
});

describe('permission group form', () => {
  it('explains a missing name and missing permissions in place and does not submit', async () => {
    const { onSubmit } = renderModal();
    await userEvent.click(save());

    expect(nameInput()).toBeInvalid();
    expect(screen.getAllByRole('alert')).toHaveLength(2);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an auto-generated code with the trimmed name and the chosen permissions', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(nameInput(), 'Quản trị merchant');
    await userEvent.type(screen.getByRole('textbox', { name: /Mô tả/ }), 'Toàn quyền');
    await userEvent.click(checkbox('VIEW_TRANSACTION'));
    await userEvent.click(screen.getByRole('tab', { name: /Hoàn tiền/ }));
    await userEvent.click(checkbox('APPROVE_REFUND'));
    await userEvent.click(save());

    expect(onSubmit).toHaveBeenCalledWith({
      code: 'QUAN_TRI_MERCHANT',
      name: 'Quản trị merchant',
      description: 'Toàn quyền',
      permissions: ['VIEW_TRANSACTION', 'APPROVE_REFUND'],
      scopeLevel: 'MASTER',
    });
  });

  it('shows the generated code under the name while typing and offers no code input', async () => {
    renderModal();
    expect(screen.queryByRole('textbox', { name: /Mã nhóm/ })).not.toBeInTheDocument();
    await userEvent.type(nameInput(), 'Thu ngân');

    expect(nameInput()).toHaveAccessibleDescription(/THU_NGAN/);
  });

  it('rejects a name that cannot produce a valid code', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(nameInput(), '2024');
    await userEvent.click(checkbox('VIEW_TRANSACTION'));
    await userEvent.click(save());

    expect(nameInput()).toBeInvalid();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills when editing and keeps the stored code even if the name changes', async () => {
    const { onSubmit } = renderModal({ group: existing });
    expect(nameInput()).toHaveValue('Kế toán');
    await userEvent.clear(nameInput());
    await userEvent.type(nameInput(), 'Tài chính');
    await userEvent.click(save());

    expect(onSubmit).toHaveBeenCalledWith({
      code: 'ACCOUNTING',
      name: 'Tài chính',
      description: 'Quản lý kế toán',
      permissions: ['VIEW_ORDER'],
      scopeLevel: 'MASTER',
    });
  });

  it('turns the backend duplicate-code failure into a Vietnamese error on the name field', () => {
    renderModal({ error: 'Permission group code already exists' });

    expect(nameInput()).toBeInvalid();
    expect(screen.queryByText('Permission group code already exists')).not.toBeInTheDocument();
  });

  it('shows other backend failures in the dialog', () => {
    renderModal({ error: 'Không lưu được nhóm quyền' });

    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('Không lưu được nhóm quyền');
  });

  it('shows the selected count in the footer and closes with the cancel button', async () => {
    const { onOpenChange } = renderModal({ group: existing });
    expect(screen.getAllByText(/Đã chọn 1 quyền/).length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables saving while a request runs', () => {
    renderModal({ isSubmitting: true });

    expect(screen.getByRole('button', { name: 'Đang lưu' })).toBeDisabled();
  });

  it('shows a loading placeholder instead of an empty catalog message while the catalog loads', () => {
    renderModal({ catalog: [], catalogLoading: true });

    expect(screen.getByRole('status', { name: /Đang tải/ })).toBeInTheDocument();
  });
});

describe('scope level', () => {
  const level = (name: RegExp) => screen.getByRole('radio', { name });

  it('defaults a new group to the Master level', () => {
    renderModal();
    expect(level(/Cấp Master/)).toBeChecked();
    expect(level(/Cấp Sub/)).not.toBeChecked();
  });

  it('sends the Sub level when it is chosen', async () => {
    const { onSubmit } = renderModal();
    await userEvent.type(nameInput(), 'Quản lí cấp sub');
    await userEvent.click(checkbox('VIEW_TRANSACTION'));
    await userEvent.click(level(/Cấp Sub/));
    await userEvent.click(save());

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scopeLevel: 'SUB' }));
  });

  it('prefills the stored level when editing', async () => {
    const { onSubmit } = renderModal({ group: { ...existing, scopeLevel: 'SUB' } });
    expect(level(/Cấp Sub/)).toBeChecked();
    await userEvent.click(save());

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ scopeLevel: 'SUB' }));
  });
});

describe('permissions the actor cannot grant', () => {
  const limited: PermissionCatalogItem[] = [
    { code: 'VIEW_TRANSACTION', category: 'TRANSACTION', grantable: true },
    { code: 'EXPORT_TRANSACTION', category: 'TRANSACTION', grantable: false },
  ];

  it('disables them and says why', () => {
    renderModal({ catalog: limited });
    expect(checkbox('EXPORT_TRANSACTION')).toHaveAttribute('aria-disabled', 'true');
    expect(checkbox('VIEW_TRANSACTION')).not.toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/Bạn chưa có quyền này/)).toBeInTheDocument();
  });

  it('selects only the grantable ones with select all', async () => {
    const { onSubmit } = renderModal({ catalog: limited });
    await userEvent.type(nameInput(), 'Xem giao dịch');
    await userEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả' }));
    await userEvent.click(save());

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ permissions: ['VIEW_TRANSACTION'] }));
  });

  it('lets an already granted one be removed but not ticked again', async () => {
    renderModal({ catalog: limited, group: { ...existing, permissions: ['EXPORT_TRANSACTION'] } });
    expect(checkbox('EXPORT_TRANSACTION')).toBeChecked();
    expect(checkbox('EXPORT_TRANSACTION')).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(checkbox('EXPORT_TRANSACTION'));
    expect(checkbox('EXPORT_TRANSACTION')).toHaveAttribute('aria-disabled', 'true');
  });
});
