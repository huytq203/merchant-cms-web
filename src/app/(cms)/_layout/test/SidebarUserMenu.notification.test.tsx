// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar/Sidebar";
import { SidebarUserMenu } from "../SidebarUserMenu";

afterEach(cleanup);

function open(canViewNotificationSettings: boolean) {
  const onOpenNotificationSettings = vi.fn();
  render(
    <SidebarProvider>
      <SidebarUserMenu
        name="Kiên"
        email="k@e.com"
        isLoggingOut={false}
        onOpenAccount={vi.fn()}
        onLogout={vi.fn()}
        canViewNotificationSettings={canViewNotificationSettings}
        onOpenNotificationSettings={onOpenNotificationSettings}
      />
    </SidebarProvider>,
  );
  return onOpenNotificationSettings;
}

describe("SidebarUserMenu notification settings item", () => {
  it("shows the item and opens the dialog when the user may manage notifications", async () => {
    const onOpen = open(true);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Kiên/ }));
    await user.click(await screen.findByRole("button", { name: /Cài đặt thông báo/ }));
    expect(onOpen).toHaveBeenCalled();
  });

  it("hides the item without the permission", async () => {
    open(false);
    await userEvent.setup().click(screen.getByRole("button", { name: /Kiên/ }));
    expect(await screen.findByRole("button", { name: /Account/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cài đặt thông báo/ })).not.toBeInTheDocument();
  });
});
