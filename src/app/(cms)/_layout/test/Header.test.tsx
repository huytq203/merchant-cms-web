// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar/Sidebar';
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

describe('Header', () => {
  it('uses the Vietnamese home label', () => {
    render(
      <SidebarProvider>
        <Header />
      </SidebarProvider>,
    );

    expect(screen.getByRole('link', { name: /Trang chủ/ })).toBeInTheDocument();
  });

  it('navigates to a route selected from page search', async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Header />
      </SidebarProvider>,
    );

    await user.type(screen.getByPlaceholderText('Tìm kiếm trang...'), 'Danh sách người dùng');
    await user.click(await screen.findByRole('option', { name: 'Danh sách người dùng' }));

    expect(push).toHaveBeenCalledWith('/users');
  });
});
