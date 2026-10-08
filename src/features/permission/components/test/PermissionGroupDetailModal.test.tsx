// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { mswServer } from '@/test/msw';
import type { PermissionGroup } from '../../schemas/permission-group.schema';
import { usePermissionCatalog } from '../../permission-group-queries';
import { PermissionGroupDetailModal } from '../PermissionGroupDetailModal';

const groupId = '11111111-1111-4111-8111-111111111111';
const catalogByCategory: Record<string, string[]> = {
  TRANSACTION: ['VIEW_TRANSACTION', 'EXPORT_TRANSACTION'],
  REFUND: ['CREATE_REFUND', 'CANCEL_REFUND', 'APPROVE_REFUND', 'VIEW_REFUND'],
  DISPUTE: ['CREATE_DISPUTE', 'REPLY_DISPUTE', 'VIEW_DISPUTE'],
  ORDER: ['CREATE_ORDER', 'CANCEL_ORDER', 'VIEW_ORDER', 'CONFIRM_ORDER'],
  FINANCE: ['CREATE_WITHDRAWAL', 'VIEW_WITHDRAWAL', 'EXPORT_WITHDRAWAL', 'VIEW_BALANCE', 'EXPORT_BALANCE'],
  ADMINISTRATION: ['VIEW_AUDIT_LOG', 'MANAGE_USER', 'MANAGE_SUB_MERCHANT', 'MANAGE_PERMISSION_GROUP'],
  WALLET: ['VIEW_WALLET', 'TOPUP_WALLET', 'WITHDRAW_WALLET', 'TRANSFER_WALLET', 'EXPORT_WALLET_STATEMENT'],
};
const catalog = Object.entries(catalogByCategory).flatMap(([category, codes]) => codes.map((code) => ({ code, category })));
const allCodes = catalog.map((item) => item.code);

const baseGroup: PermissionGroup = {
  id: groupId,
  merchantId: null,
  code: 'CSKH',
  name: 'CSKH',
  description: null,
  system: false,
  permissions: ['VIEW_TRANSACTION', 'VIEW_ORDER', 'VIEW_REFUND'],
  createdAt: '2026-10-01T17:14:00',
};
const fifteen = [...catalogByCategory.TRANSACTION!, ...catalogByCategory.REFUND!, ...catalogByCategory.DISPUTE!, ...catalogByCategory.ORDER!, 'VIEW_WALLET', 'TOPUP_WALLET'];

/** jsdom has no layout, so widths are injected: a 300px chip row and 100px chips. */
const layout = { container: 1000, chip: 100 };
const observers: { callback: () => void }[] = [];

/** Only the permission rows are tracked; other libraries (floating-ui) also create observers. */
class FakeResizeObserver {
  private readonly callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
  }
  observe(element: Element) {
    if (element.getAttribute('aria-label')?.startsWith('Quyền nhóm')) observers.push({ callback: this.callback });
  }
  disconnect() {}
}

function usersResponse(count: number) {
  const rows = Array.from({ length: Math.min(count, 10) }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    email: `nguoi${index}@beamewa.com.vn`,
    fullName: `Người Dùng${index}`,
    status: 'ACTIVE',
  }));
  return HttpResponse.json({ rows, total: count });
}

function Harness({ group, onEdit }: { group: PermissionGroup; onEdit?: () => void }) {
  const query = usePermissionCatalog();
  return <PermissionGroupDetailModal open onOpenChange={vi.fn()} group={group} catalog={query} onEdit={onEdit} />;
}

function renderModal(group: PermissionGroup, onEdit?: () => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Harness group={group} onEdit={onEdit} />
    </QueryClientProvider>,
  );
}

async function readyDialog() {
  const dialog = await screen.findByRole('dialog');
  await within(dialog).findByRole('img', { name: /Nhóm có/ });
  return dialog;
}

beforeEach(() => {
  layout.container = 1000;
  observers.length = 0;
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('aria-label')?.startsWith('Quyền nhóm') ? layout.container : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get(this: HTMLElement) {
      return this.tagName === 'LI' && this.parentElement?.getAttribute('aria-label')?.startsWith('Quyền nhóm') ? layout.chip : 0;
    },
  });
  mswServer.use(http.get('/api/v1/merchant/merchant-permissions', () => HttpResponse.json(catalog)));
  mswServer.use(http.get(`/api/v1/merchant/permission-groups/${groupId}/users`, () => usersResponse(0)));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'clientWidth');
  Reflect.deleteProperty(HTMLElement.prototype, 'offsetWidth');
});

describe('permission group detail modal: permissions', () => {
  it('shows a 3 permission group with N taken from the catalog and no overflow buttons when every label fits', async () => {
    renderModal(baseGroup);
    const dialog = await readyDialog();
    expect(within(dialog).getByText('3/27 quyền')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Nhóm có 3 trên 27 quyền' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('list', { name: /Quyền nhóm/ })).toHaveLength(3);
    expect(within(dialog).queryByRole('button', { name: /quyền$/ })).not.toBeInTheDocument();
    expect(within(dialog).getByText(/Không có quyền ở: .*Tranh chấp.*Tài chính/)).toBeInTheDocument();
    expect(within(dialog).getByText('Chưa có mô tả')).toBeInTheDocument();
  });

  it('collapses long rows to the labels that fit and counts the hidden ones', async () => {
    layout.container = 300;
    renderModal({ ...baseGroup, permissions: fifteen });
    const dialog = await readyDialog();
    expect(within(dialog).getByText('15/27 quyền')).toBeInTheDocument();
    const refund = within(dialog).getByRole('list', { name: 'Quyền nhóm Hoàn tiền' });
    expect(within(refund).getAllByRole('listitem')).toHaveLength(4);
    const toggles = within(dialog).getAllByRole('button', { name: '+2 quyền' });
    expect(toggles).toHaveLength(2);
    expect(toggles[0]).toHaveAttribute('aria-expanded', 'false');
    expect(within(dialog).getByRole('button', { name: '+1 quyền' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: /^\+\d+ quyền$/ })).toHaveLength(3);
    expect(within(dialog).queryByRole('button', { name: 'Thu gọn' })).not.toBeInTheDocument();
  });

  it('expands and collapses a row and re-measures when the container resizes', async () => {
    layout.container = 300;
    renderModal({ ...baseGroup, permissions: fifteen });
    const dialog = await readyDialog();
    await userEvent.click(within(dialog).getAllByRole('button', { name: '+2 quyền' })[0]!);
    const collapse = within(dialog).getByRole('button', { name: 'Thu gọn' });
    expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(collapse);
    expect(within(dialog).getAllByRole('button', { name: '+2 quyền' })[0]).toHaveAttribute('aria-expanded', 'false');

    layout.container = 1000;
    act(() => observers.forEach((observer) => observer.callback()));
    expect(within(dialog).queryByRole('button', { name: /^\+\d+ quyền$/ })).not.toBeInTheDocument();
  });

  it('shows all 27 permissions for a system group without edit and without the empty-categories line', async () => {
    renderModal({ ...baseGroup, name: 'Quản lý tổng', code: 'QUAN_LY_TONG', system: true, permissions: allCodes });
    const dialog = await readyDialog();
    expect(within(dialog).getByText('27/27 quyền')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Nhóm có 27 trên 27 quyền' })).toBeInTheDocument();
    expect(within(dialog).getAllByRole('list', { name: /Quyền nhóm/ })).toHaveLength(7);
    expect(within(dialog).queryByText(/Không có quyền ở/)).not.toBeInTheDocument();
    expect(within(dialog).getByText('Hệ thống')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Sửa' })).not.toBeInTheDocument();
  });
});

describe('permission group detail modal: header and footer', () => {
  it('hides the copy button when the group has no code and shows Edit only when allowed', async () => {
    const onEdit = vi.fn();
    renderModal({ ...baseGroup, code: undefined }, onEdit);
    const dialog = await readyDialog();
    expect(within(dialog).queryByRole('button', { name: /Sao chép mã/ })).not.toBeInTheDocument();
    expect(within(dialog).getByText('Merchant')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sửa' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('offers copying the group code', async () => {
    renderModal(baseGroup);
    const dialog = await readyDialog();
    expect(within(dialog).getByRole('button', { name: 'Sao chép mã CSKH' })).toBeInTheDocument();
  });
});

describe('permission group detail modal: users', () => {
  it('shows an empty state with guidance when the group has no users', async () => {
    renderModal(baseGroup);
    const dialog = await readyDialog();
    expect(await within(dialog).findByText('Chưa có người dùng trong nhóm')).toBeInTheDocument();
  });

  it('previews 5 users and reveals the rest on request', async () => {
    mswServer.use(http.get(`/api/v1/merchant/permission-groups/${groupId}/users`, () => usersResponse(12)));
    renderModal(baseGroup);
    const dialog = await readyDialog();
    expect(await within(dialog).findByText('nguoi0@beamewa.com.vn')).toBeInTheDocument();
    expect(within(dialog).queryByText('nguoi5@beamewa.com.vn')).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Xem thêm 7 người' }));
    expect(within(dialog).getByText('nguoi9@beamewa.com.vn')).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /Xem thêm/ })).not.toBeInTheDocument();
  });

  it('shows the BE error for users', async () => {
    mswServer.use(http.get(`/api/v1/merchant/permission-groups/${groupId}/users`, () => HttpResponse.json({ message: 'Không tải được người dùng' }, { status: 500 })));
    renderModal(baseGroup);
    const dialog = await readyDialog();
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Không tải được người dùng');
  });
});
