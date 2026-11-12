// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar/Sidebar';
import { mswServer } from '@/test/msw';
import Header from '../Header';

const push = vi.fn();

afterEach(() => {
  cleanup();
  push.mockReset();
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/users',
  useRouter: () => ({ push }),
}));

function serveUnread(count: number) {
  mswServer.use(
    http.get('/api/v1/admin/notifications/unread-count', () =>
      HttpResponse.json({ count, byCategory: { PAYMENT: count, WITHDRAWAL: 0, OTHER: 0 } })),
  );
}

function renderHeader() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <Header />
      </SidebarProvider>
    </QueryClientProvider>,
  );
}

describe('Header', () => {
  it('uses the Vietnamese home label', () => {
    serveUnread(0);
    renderHeader();

    expect(screen.getByRole('link', { name: /Trang chủ/ })).toBeInTheDocument();
  });

  it('navigates to a route selected from page search', async () => {
    serveUnread(0);
    const user = userEvent.setup();
    renderHeader();

    await user.type(screen.getByPlaceholderText('Tìm kiếm trang...'), 'Danh sách người dùng');
    await user.click(await screen.findByRole('option', { name: 'Danh sách người dùng' }));

    expect(push).toHaveBeenCalledWith('/users');
  });

  it('shows the notification bell with the unread count', async () => {
    serveUnread(7);
    renderHeader();

    expect(await screen.findByRole('button', { name: 'Thông báo, 7 chưa đọc' })).toBeInTheDocument();
  });

  it('caps the bell badge at 99+', async () => {
    serveUnread(250);
    renderHeader();

    const bell = await screen.findByRole('button', { name: 'Thông báo, 99+ chưa đọc' });
    expect(bell.textContent).toContain('99+');
  });

  it('shows no badge when nothing is unread', async () => {
    serveUnread(0);
    renderHeader();

    const bell = await screen.findByRole('button', { name: 'Thông báo' });
    expect(bell.textContent).not.toMatch(/\d/);
  });
});
