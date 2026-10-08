// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { mswServer } from '@/test/msw';
import { SubMerchantsContainer } from '../SubMerchantsContainer';
import type { SubMerchantDetail, SubMerchantRow } from '../../types';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }), usePathname: () => '/sub-merchants' }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
const filter = { page: 1, pageSize: 10 };
const row: SubMerchantRow = {
  id: 'one',
  code: 'SM001',
  name: 'Shop',
  status: 'ACTIVE',
  isDefault: false,
  lockSource: null,
  merchantId: 'merchant',
  merchantCode: null,
  merchantName: null,
  phone: null,
  createdAt: null,
};
const ownField = { source: null, inherited: false, suspended: false };
const detail: SubMerchantDetail = {
  ...row,
  merchantId: 'merchant',
  businessField: 'Retail',
  legalName: 'Shop Ltd',
  taxCode: '123',
  legalRepresentativeName: 'Owner',
  taxCodeEditable: false,
  phone: { value: '123', ...ownField },
  address: { value: 'Addr', ...ownField },
  updatedAt: null,
};
const base = '/api/v1/admin/sub-merchants';
function renderContainer(data?: { rows: SubMerchantRow[]; total: number }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (data) mswServer.use(http.get(base, () => HttpResponse.json(data)));
  return render(<QueryClientProvider client={client}><SubMerchantsContainer filter={filter} /></QueryClientProvider>);
}
beforeEach(() => mswServer.use(http.get(base, () => HttpResponse.json({ rows: [row], total: 1 }))));
afterEach(() => { cleanup(); push.mockClear(); vi.clearAllMocks(); });

describe('sub merchants container', () => {
  it('shows loading, error, empty, and data states', async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    loading.unmount();
    mswServer.use(http.get(base, () => HttpResponse.json({ message: 'Không thể tải danh sách' }, { status: 500 })));
    const error = renderContainer();
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải danh sách');
    error.unmount();
    const empty = renderContainer({ rows: [], total: 0 });
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    empty.unmount();
    renderContainer({ rows: [row], total: 1 });
    expect(await screen.findByText('SM001')).toBeInTheDocument();
  });

  it('creates a sub merchant and closes the form with a success toast', async () => {
    let body: unknown;
    mswServer.use(http.post(base, async ({ request }) => { body = await request.json(); return HttpResponse.json(detail); }));
    renderContainer({ rows: [row], total: 1 });
    await userEvent.click(screen.getByRole('button', { name: /Thêm mới/ }));
    await userEvent.type(await screen.findByRole('textbox', { name: /Tên điểm bán/ }), 'New shop');
    await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa điện thoại/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa địa chỉ/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(body).toMatchObject({ name: 'New shop' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toast.success).toHaveBeenCalled();
  });

  it('loads detail for viewing and editing, then sends an update', async () => {
    let body: unknown;
    mswServer.use(http.get(`${base}/one`, () => HttpResponse.json(detail)));
    mswServer.use(http.put(`${base}/one`, async ({ request }) => { body = await request.json(); return HttpResponse.json(detail); }));
    renderContainer({ rows: [row], total: 1 });
    await userEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết Shop' }));
    expect(await screen.findByText('Shop Ltd')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sửa Shop' }));
    expect(await screen.findByRole('textbox', { name: /Tên điểm bán/ })).toHaveValue('Shop');
    await userEvent.clear(screen.getByRole('textbox', { name: /Tên điểm bán/ }));
    await userEvent.type(screen.getByRole('textbox', { name: /Tên điểm bán/ }), 'Edited shop');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    await waitFor(() => expect(body).toMatchObject({ name: 'Edited shop' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('validates the lock reason, sends a valid reason, and keeps a server error visible', async () => {
    let reason: unknown;
    mswServer.use(http.post(`${base}/one/lock`, async ({ request }) => { reason = await request.json(); return HttpResponse.json({ message: 'Xung đột trạng thái' }, { status: 409 }); }));
    renderContainer({ rows: [row], total: 1 });
    await userEvent.click(await screen.findByRole('button', { name: 'Khóa Shop' }));
    await userEvent.type(await screen.findByRole('textbox', { name: /Lý do/ }), 'short');
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
    expect(screen.getByText('Lý do phải từ 10 đến 500 ký tự')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: /Lý do/ }), ' but now valid');
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => expect(reason).toEqual({ reason: 'short but now valid' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Xung đột trạng thái');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not offer filters the endpoint cannot apply', async () => {
    renderContainer({ rows: [row], total: 1 });
    await screen.findByText('SM001');
    expect(screen.queryByRole('textbox', { name: /Tên \/ Mã sub-merchant/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tìm kiếm' })).not.toBeInTheDocument();
  });

  it('updates the URL when the page changes', async () => {
    renderContainer({ rows: [row], total: 30 });
    await userEvent.click(await screen.findByRole('button', { name: /Next|Trang sau/i }));
    expect(push).toHaveBeenCalledWith('/sub-merchants?page=2&pageSize=10');
  });

  it('keeps the form open and shows the server error when saving fails', async () => {
    mswServer.use(http.post(base, () => HttpResponse.json({ message: 'Tên điểm bán đã tồn tại' }, { status: 409 })));
    renderContainer({ rows: [row], total: 1 });
    await userEvent.click(screen.getByRole('button', { name: /Thêm mới/ }));
    await userEvent.type(await screen.findByRole('textbox', { name: /Tên điểm bán/ }), 'New shop');
    await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa điện thoại/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Kế thừa địa chỉ/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tên điểm bán đã tồn tại');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
