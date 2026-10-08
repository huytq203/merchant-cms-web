// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { mswServer } from '@/test/msw';
import { PERMISSION_LABELS } from '../../constants/permission-labels';
import type { PermissionGroup } from '../../schemas/permission-group.schema';
import { PermissionGroupContainer } from '../PermissionGroupContainer';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/permissions' }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base = '/api/v1/merchant/permission-groups';
const id = '11111111-1111-4111-8111-111111111111';
const editable: PermissionGroup = {
  id,
  merchantId: null,
  code: 'ACCOUNTING',
  name: 'Kế toán',
  description: 'Quản lý kế toán',
  system: false,
  permissions: ['VIEW_ORDER'],
  createdAt: null,
};
const systemGroup: PermissionGroup = {
  ...editable,
  id: '22222222-2222-4222-8222-222222222222',
  code: 'SYSTEM',
  name: 'Hệ thống',
  system: true,
};
const filter = { page: 1, pageSize: 10 };

function renderContainer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  mswServer.use(http.get('/api/v1/merchant/merchant-permissions', () => HttpResponse.json([{ code: 'VIEW_ORDER', category: 'ORDER' }] )));
  return render(
    <QueryClientProvider client={client}>
      <PermissionGroupContainer filter={filter} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  push.mockClear();
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [editable], total: 1 })));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('permission group container', () => {
  it('shows loading, error, empty and data states', async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    loading.unmount();

    mswServer.use(http.get(base, () => HttpResponse.json({ message: 'Không tải được nhóm quyền' }, { status: 500 })));
    const failed = renderContainer();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không tải được nhóm quyền');
    failed.unmount();

    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0 })));
    const empty = renderContainer();
    await waitFor(() => expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy'));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    empty.unmount();

    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [editable], total: 1 })));
    renderContainer();
    expect(await screen.findByText('Kế toán')).toBeInTheDocument();
  });

  it('creates a group with selected permissions and refreshes the list', async () => {
    let body: unknown;
    let rows = [editable];
    renderContainer();
    mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));
    mswServer.use(http.post(base, async ({ request }) => {
      body = await request.json();
      rows = [...rows, { ...editable, id: systemGroup.id, code: 'CASHIER', name: 'Thu ngân' }];
      return HttpResponse.json(rows[1]);
    }));

    await userEvent.click(screen.getByRole('button', { name: 'Thêm nhóm quyền' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Tên nhóm/ }), 'Thu ngân');
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Mô tả/ }), 'Quản lý thu ngân');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: PERMISSION_LABELS.VIEW_ORDER }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu nhóm quyền' }));
    await waitFor(() => expect(body).toEqual({ code: 'THU_NGAN', name: 'Thu ngân', description: 'Quản lý thu ngân', permissions: ['VIEW_ORDER'] }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Thu ngân')).toBeInTheDocument();
  });

  it('prefills and updates a group', async () => {
    let body: unknown;
    let current = editable;
    renderContainer();
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [current], total: 1 })));
    mswServer.use(http.get(`${base}/${id}`, () => HttpResponse.json(editable)));
    mswServer.use(http.put(`${base}/${id}`, async ({ request }) => {
      body = await request.json();
      current = { ...editable, name: 'Kế toán mới' };
      return HttpResponse.json(current);
    }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sửa Kế toán' }));
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByRole('textbox', { name: /Tên nhóm/ });
    expect(name).toHaveValue('Kế toán');
    await userEvent.clear(name);
    await userEvent.type(name, 'Kế toán mới');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Lưu nhóm quyền' }));
    await waitFor(() => expect(body).toMatchObject({ code: 'ACCOUNTING', name: 'Kế toán mới', permissions: ['VIEW_ORDER'] }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Kế toán mới')).toBeInTheDocument();
  });

  it('keeps the group and shows the BE reason when deletion conflicts', async () => {
    renderContainer();
    mswServer.use(http.delete(`${base}/${id}`, () => HttpResponse.json({ message: 'Nhóm đang có người dùng' }, { status: 409 })));
    await userEvent.click(await screen.findByRole('button', { name: 'Xoá Kế toán' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xóa nhóm' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nhóm đang có người dùng');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Kế toán')).toBeInTheDocument();
  });

  it('keeps naming the group while the delete dialog plays its closing animation', async () => {
    const getAnimations = vi.fn(() => [{ finished: new Promise<void>(() => undefined) }]);
    Object.defineProperty(Element.prototype, 'getAnimations', { configurable: true, value: getAnimations });
    try {
      renderContainer();
      await userEvent.click(await screen.findByRole('button', { name: 'Xoá Kế toán' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByRole('heading')).toHaveTextContent('Kế toán');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
      const closing = screen.getByRole('dialog', { hidden: true });
      expect(within(closing).getByRole('heading', { hidden: true })).toHaveTextContent('Kế toán');
      expect(closing).not.toHaveTextContent(/nhóm\s*\?/);
    } finally {
      Reflect.deleteProperty(Element.prototype, 'getAnimations');
    }
  });

  it('shows only detail for a system group and updates the URL for search and page', async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [systemGroup], total: 30 })));
    renderContainer();
    expect(await screen.findByRole('button', { name: 'Xem Hệ thống' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sửa Hệ thống' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xoá Hệ thống' })).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: /Tên nhóm quyền/ }), 'Hệ thống');
    await userEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));
    expect(push).toHaveBeenCalledWith('/permissions?page=1&pageSize=10&keyword=H%E1%BB%87+th%E1%BB%91ng');
    await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    expect(push).toHaveBeenCalledWith('/permissions?page=2&pageSize=10');
  });

  it('searches when Enter is pressed in the filter and clears the filter with the reset button', async () => {
    renderContainer();
    await userEvent.type(screen.getByRole('textbox', { name: /Tên nhóm quyền/ }), 'Kế toán{Enter}');
    expect(push).toHaveBeenCalledWith('/permissions?page=1&pageSize=10&keyword=K%E1%BA%BF+to%C3%A1n');
    await userEvent.click(screen.getByRole('button', { name: 'Xóa lọc' }));
    expect(push).toHaveBeenLastCalledWith('/permissions?page=1&pageSize=10');
  });

  it('shows permission names instead of raw codes in the detail dialog', async () => {
    mswServer.use(http.get(`${base}/${id}/users`, () => HttpResponse.json({ rows: [], total: 0 })));
    renderContainer();
    await userEvent.click(await screen.findByRole('button', { name: 'Xem Kế toán' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(PERMISSION_LABELS.VIEW_ORDER);
    expect(dialog).not.toHaveTextContent('VIEW_ORDER');
  });
});
