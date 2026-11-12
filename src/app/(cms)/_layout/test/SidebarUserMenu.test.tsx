// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarProvider } from "@/components/ui/sidebar/Sidebar";
import { SidebarUserMenu } from "../SidebarUserMenu";

afterEach(cleanup);

describe("SidebarUserMenu", () => {
  it("no longer carries a notifications item: the bell lives in the header", async () => {
    render(
      <SidebarProvider>
        <SidebarUserMenu name="Kiên" email="kien@example.com" isLoggingOut={false} onOpenAccount={vi.fn()} onLogout={vi.fn()} />
      </SidebarProvider>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: /Kiên/ }));
    expect(await screen.findByRole("button", { name: /Account/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Notifications/ })).not.toBeInTheDocument();
  });
});
