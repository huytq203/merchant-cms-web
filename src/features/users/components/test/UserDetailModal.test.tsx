// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import type { MerchantUser, ScopeProposal } from "../../schemas/user.schema";
import { UserDetailModal } from "../UserDetailModal";

const merchantA = "11111111-1111-4111-8111-111111111111";
const groupId = "33333333-3333-4333-8333-333333333333";
const subMerchantId = "55555555-5555-4555-8555-555555555555";
const actorId = "99999999-9999-4999-8999-999999999999";
const user: MerchantUser = {
  id: "44444444-4444-4444-8444-444444444444",
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  fullName: "Test User",
  phone: null,
  active: true,
  locked: false,
  groups: [groupId],
  merchantIds: [merchantA],
  subMerchantIds: [],
  rolesText: "Vận hành",
  createdAt: "2026-10-07T09:04:00",
};
const proposal: ScopeProposal = {
  id: "77777777-7777-4777-8777-777777777777",
  merchantUserId: user.id,
  status: "PENDING_APPROVAL",
  merchantIds: [merchantA],
  subMerchantIds: [subMerchantId],
  requestReason: "Cần thêm cửa hàng để vận hành",
  decisionReason: null,
  createdAt: "2026-10-05T10:00:00",
  decidedAt: null,
};

function renderModal(props: Partial<React.ComponentProps<typeof UserDetailModal>> = {}) {
  mswServer.use(
    http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [{ id: groupId, name: "Vận hành", merchantId: merchantA, permissions: [] }],
      total: 1,
    })),
    http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({
      rows: [{ id: subMerchantId, code: "S1", name: "Cửa hàng 1" }],
      total: 1,
    })),
  );
  const handlers = { onReset: vi.fn(), onToggleLock: vi.fn(), onEdit: vi.fn(), onApprove: vi.fn(), onReject: vi.fn() };
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <UserDetailModal
        open
        onOpenChange={vi.fn()}
        user={user}
        actorId={actorId}
        merchantIds={[merchantA]}
        proposal={null}
        isPending={false}
        {...handlers}
        {...props}
      />
    </QueryClientProvider>,
  );
  return handlers;
}

afterEach(cleanup);

describe("user detail modal", () => {
  it("shows the permission group name instead of its id", async () => {
    renderModal();
    expect(await screen.findByText("Vận hành")).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(groupId))).not.toBeInTheDocument();
  });

  it("shows a placeholder for a missing phone and the whole merchant when no sub-merchant is set", async () => {
    renderModal();
    expect(screen.getByText("Chưa có")).toBeInTheDocument();
    expect(screen.getByText("Toàn bộ merchant")).toBeInTheDocument();
    await screen.findByText("Vận hành");
  });

  it("lists the sub-merchants the user is limited to", async () => {
    renderModal({ user: { ...user, subMerchantIds: [subMerchantId] } });
    expect(await screen.findByText(/Cửa hàng 1/)).toBeInTheDocument();
    expect(screen.queryByText("Toàn bộ merchant")).not.toBeInTheDocument();
  });

  it("offers reset password and lock for an active user and reports the clicks", async () => {
    const { onReset, onToggleLock } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    await userEvent.click(screen.getByRole("button", { name: "Khóa tài khoản" }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onToggleLock).toHaveBeenCalledTimes(1);
  });

  it("offers unlock for a locked user and disables reset password with the reason", () => {
    renderModal({ user: { ...user, locked: true, active: false } });
    expect(screen.getByRole("button", { name: "Mở khóa" })).toBeEnabled();
    const reset = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
    expect(reset).toBeDisabled();
    expect(reset).toHaveAccessibleDescription(/\S/);
  });

  it("offers resend activation instead of reset password for a pending user", () => {
    renderModal({ user: { ...user, active: false } });
    expect(screen.queryByRole("button", { name: "Đặt lại mật khẩu" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi lại kích hoạt" })).toBeEnabled();
  });

  it("disables both quick actions on the current user's own account", () => {
    renderModal({ actorId: user.id });
    const reset = screen.getByRole("button", { name: "Đặt lại mật khẩu" });
    const lock = screen.getByRole("button", { name: "Khóa tài khoản" });
    expect(reset).toBeDisabled();
    expect(lock).toBeDisabled();
    expect(reset).toHaveAccessibleDescription(/\S/);
    expect(lock).toHaveAccessibleDescription(/\S/);
  });

  it("shows the edit button only when editing is allowed", async () => {
    const { onEdit } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Sửa" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    cleanup();
    renderModal({ onEdit: undefined });
    expect(screen.queryByRole("button", { name: "Sửa" })).not.toBeInTheDocument();
  });

  it("hides the scope proposal section when there is no proposal", () => {
    renderModal();
    expect(screen.queryByRole("region", { name: /đề xuất/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Duyệt đề xuất" })).not.toBeInTheDocument();
  });

  it("lets the reviewer approve or reject a pending proposal", async () => {
    const { onApprove, onReject } = renderModal({ proposal });
    expect(screen.getByRole("region", { name: /đề xuất/i })).toHaveTextContent(proposal.requestReason);
    await userEvent.click(screen.getByRole("button", { name: "Duyệt đề xuất" }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Từ chối đề xuất" })).toBeDisabled();
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do từ chối/ }), "Không phù hợp");
    await userEvent.click(screen.getByRole("button", { name: "Từ chối đề xuất" }));
    expect(onReject).toHaveBeenCalledWith("Không phù hợp");
  });

  it("shows a proposal error as an alert", () => {
    renderModal({ proposalError: "Không duyệt được" });
    expect(screen.getByRole("alert")).toHaveTextContent("Không duyệt được");
  });
});
