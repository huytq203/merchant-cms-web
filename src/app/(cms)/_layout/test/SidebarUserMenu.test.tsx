// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar/Sidebar";
import { SidebarUserMenu } from "../SidebarUserMenu";

function renderMenu(unreadCount: number, onOpenNotifications = vi.fn()) {
  render(
    <SidebarProvider>
      <SidebarUserMenu
        name="Kiên"
        email="kien@example.com"
        isLoggingOut={false}
        unreadCount={unreadCount}
        onOpenAccount={vi.fn()}
        onOpenNotifications={onOpenNotifications}
        onLogout={vi.fn()}
      />
    </SidebarProvider>,
  );
  return onOpenNotifications;
}

async function openMenu() {
  await userEvent.setup().click(screen.getByRole("button", { name: /Kiên/ }));
}

afterEach(cleanup);

describe("SidebarUserMenu notifications item", () => {
  it("opens the notifications sheet when the item is chosen", async () => {
    const open = renderMenu(2);
    await openMenu();
    await userEvent.setup().click(await screen.findByRole("button", { name: /Notifications/ }));
    expect(open).toHaveBeenCalledTimes(1);
  });

  it("shows the unread count in the item and in its accessible name", async () => {
    renderMenu(3);
    await openMenu();
    expect(await screen.findByRole("button", { name: /Notifications.*3.*chưa đọc/ })).toBeInTheDocument();
  });

  it("shows no badge when nothing is unread", async () => {
    renderMenu(0);
    await openMenu();
    const item = await screen.findByRole("button", { name: /Notifications/ });
    expect(item.textContent).not.toMatch(/\d/);
  });

  it("caps a large count at 99+", async () => {
    renderMenu(250);
    await openMenu();
    expect(await screen.findByRole("button", { name: /Notifications.*99\+/ })).toBeInTheDocument();
  });
});
