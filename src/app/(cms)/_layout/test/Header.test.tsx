// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar/Sidebar';
import { mswServer } from '@/test/msw';
import Header from '../Header';

const push = vi.fn();

/** The header hosts the notification bell, which needs a query client and polls the unread count. */
function Providers({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <SidebarProvider>{children}</SidebarProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  mswServer.use(http.get('/api/v1/merchant/notifications/unread-count', () => HttpResponse.json({ count: 2 })));
});

afterEach(() => {
  cleanup();
  push.mockReset();
});

vi.mock('next/navigation', () => ({
  usePathname: () => '/users',
  useRouter: () => ({ push }),
}));

describe('Header', () => {
  it('uses the Vietnamese home label', () => {
    render(
      <Providers>
        <Header />
      </Providers>,
    );

    expect(screen.getByRole('link', { name: /Trang chủ/ })).toBeInTheDocument();
  });

  it('navigates to a route selected from page search', async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <Header />
      </Providers>,
    );

    await user.type(screen.getByPlaceholderText('Tìm kiếm trang...'), 'Danh sách người dùng');
    await user.click(await screen.findByRole('option', { name: 'Danh sách người dùng' }));

    expect(push).toHaveBeenCalledWith('/users');
  });

  it('shows the notification bell with the unread count', async () => {
    render(
      <Providers>
        <Header />
      </Providers>,
    );

    expect(await screen.findByRole('button', { name: 'Thông báo, 2 chưa đọc' })).toBeInTheDocument();
  });
});
