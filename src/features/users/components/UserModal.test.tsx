// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import type { MerchantUser } from "../schemas/user.schema";
import { UserModal } from "./UserModal";

const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "33333333-3333-4333-8333-333333333333";
const subMerchantId = "55555555-5555-4555-8555-555555555555";
const existingUser: MerchantUser = {
  id: "44444444-4444-4444-8444-444444444444",
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  fullName: "Test User",
  phone: null,
  isActive: true,
  isLocked: false,
  groups: [groupId],
  status: "ACTIVE",
  groupIds: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
  rolesText: "Vận hành",
  createdAt: "",
};

afterEach(cleanup);

function renderModal(props: Partial<React.ComponentProps<typeof UserModal>> = {}) {
  mswServer.use(
    http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [{ id: groupId, name: "Vận hành", merchantId }],
      total: 1,
    })),
    http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({
      rows: [{ id: subMerchantId, code: "S1", name: "Cửa hàng 1" }],
      total: 1,
    })),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSubmit = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <UserModal
        open
        onOpenChange={vi.fn()}
        merchantId={merchantId}
        isSubmitting={false}
        onSubmit={onSubmit}
        {...props}
      />
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe("user modal", () => {
  it("submits email, name and selected group for creation", async () => {
    const onSubmit = renderModal();
    await userEvent.type(screen.getByRole("textbox", { name: /Email/ }), "user@example.com");
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "Test User");
    await userEvent.click(await screen.findByRole("checkbox", { name: "Vận hành" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      email: "user@example.com",
      fullName: "Test User",
      groupIds: [groupId],
    }));
  });

  it("shows a duplicate-email response at the email input", () => {
    renderModal({ emailError: "Email đã tồn tại" });
    expect(screen.getByRole("textbox", { name: /Email/ })).toBeInTheDocument();
    expect(screen.getByText("Email đã tồn tại")).toBeInTheDocument();
  });

  it("does not render a form that creates a scope proposal while editing", async () => {
    const onSubmit = renderModal({ user: existingUser });
    expect(screen.queryByRole("checkbox", { name: "Cửa hàng 1" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /Lý do đổi phạm vi/ })).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not let the current user remove their own groups", async () => {
    renderModal({ actorId: existingUser.id, user: existingUser });
    expect(await screen.findByRole("checkbox", { name: "Vận hành" })).toHaveAttribute("aria-disabled", "true");
  });
});
