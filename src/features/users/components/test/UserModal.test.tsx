// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import type { MerchantUser } from "../../schemas/user.schema";
import { UserModal } from "../UserModal";

const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "33333333-3333-4333-8333-333333333333";
const otherGroupId = "66666666-6666-4666-8666-666666666666";
const subMerchantId = "55555555-5555-4555-8555-555555555555";
const existingUser: MerchantUser = {
  id: "44444444-4444-4444-8444-444444444444",
  keycloakUserId: "keycloak-user",
  email: "user@example.com",
  fullName: "Test User",
  phone: null,
  active: true,
  locked: false,
  groups: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
  rolesText: "Vận hành",
  createdAt: "",
};

afterEach(cleanup);

function renderModal(props: Partial<React.ComponentProps<typeof UserModal>> = {}, proposal?: unknown) {
  mswServer.use(
    http.get("/api/v1/merchant/merchant-users/:id/scope-proposal", () =>
      proposal ? HttpResponse.json(proposal) : HttpResponse.json(null, { status: 404 })),
    http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [
        { id: groupId, name: "Vận hành", merchantId, permissions: ["A", "B", "C"] },
        { id: otherGroupId, name: "Kế toán", merchantId, permissions: ["A"] },
      ],
      total: 2,
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
        merchantIds={[merchantId]}
        isSubmitting={false}
        onSubmit={onSubmit}
        {...props}
      />
    </QueryClientProvider>,
  );
  return onSubmit;
}

async function fillRequired() {
  await userEvent.type(screen.getByRole("textbox", { name: /Email/ }), "new@example.com");
  await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "New User");
  await userEvent.click(await screen.findByRole("checkbox", { name: "Vận hành" }));
}

const submitCreate = () => userEvent.click(screen.getByRole("button", { name: "Thêm người dùng" }));

describe("user modal: create", () => {
  it("submits email, name, phone and the chosen group for the whole merchant", async () => {
    const onSubmit = renderModal();
    await fillRequired();
    await userEvent.type(screen.getByRole("textbox", { name: /Số điện thoại/ }), "0912345678");
    await submitCreate();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      email: "new@example.com",
      fullName: "New User",
      phone: "0912345678",
      groupIds: [groupId],
      subMerchantIds: [],
    }));
  });

  it("shows field errors and sends nothing when required values are missing", async () => {
    const onSubmit = renderModal();
    await screen.findByRole("checkbox", { name: "Vận hành" });
    await submitCreate();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: /Email/ })).toBeInvalid();
    expect(screen.getByRole("textbox", { name: /Họ và tên/ })).toBeInvalid();
    expect(screen.getAllByRole("alert").length).toBeGreaterThanOrEqual(3);
  });

  it("requires at least one permission group", async () => {
    const onSubmit = renderModal();
    await userEvent.type(screen.getByRole("textbox", { name: /Email/ }), "new@example.com");
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "New User");
    await screen.findByRole("checkbox", { name: "Vận hành" });
    await submitCreate();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: /Nhóm quyền/ })).toHaveAccessibleDescription(/\S/);
  });

  it("shows how many permissions each group grants", async () => {
    renderModal();
    expect(await screen.findByText("3 quyền")).toBeInTheDocument();
    expect(screen.getByText("1 quyền")).toBeInTheDocument();
  });

  it("sends the chosen sub-merchants only in selected-scope mode", async () => {
    const onSubmit = renderModal();
    await fillRequired();
    await userEvent.click(screen.getByRole("radio", { name: "Chọn sub-merchant" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Cửa hàng 1/ }));
    expect(screen.getByText(/Đã chọn 1\/1/)).toBeInTheDocument();
    await submitCreate();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ subMerchantIds: [subMerchantId] }));
  });

  it("requires a sub-merchant when selected-scope mode has none ticked", async () => {
    const onSubmit = renderModal();
    await fillRequired();
    await userEvent.click(screen.getByRole("radio", { name: "Chọn sub-merchant" }));
    await submitCreate();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText(/Chọn ít nhất một sub-merchant/)).toBeInTheDocument();
  });

  it("drops ticked sub-merchants after going back to the whole merchant", async () => {
    const onSubmit = renderModal();
    await fillRequired();
    await userEvent.click(screen.getByRole("radio", { name: "Chọn sub-merchant" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Cửa hàng 1/ }));
    await userEvent.click(screen.getByRole("radio", { name: "Toàn bộ merchant" }));
    await submitCreate();
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ subMerchantIds: [] }));
  });

  it("shows a duplicate-email response at the email input", () => {
    renderModal({ emailError: "Email đã tồn tại" });
    expect(screen.getByRole("textbox", { name: /Email/ })).toHaveAccessibleDescription("Email đã tồn tại");
  });

  it("shows a backend failure as an alert", () => {
    renderModal({ error: "Không lưu được người dùng" });
    expect(screen.getByRole("alert")).toHaveTextContent("Không lưu được người dùng");
  });
});

describe("user modal: update", () => {
  it("keeps the email read-only and ticks the user's groups", async () => {
    renderModal({ user: existingUser, actorId: "someone-else" });
    expect(screen.getByRole("textbox", { name: /Email/ })).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: /Email/ })).toHaveValue("user@example.com");
    expect(await screen.findByRole("checkbox", { name: "Vận hành" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Kế toán" })).not.toBeChecked();
  });

  it("saves the edited name and groups without a sub-merchant picker", async () => {
    const onSubmit = renderModal({ user: existingUser, actorId: "someone-else" });
    await userEvent.click(await screen.findByRole("checkbox", { name: "Kế toán" }));
    await userEvent.clear(screen.getByRole("textbox", { name: /Họ và tên/ }));
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "Renamed");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fullName: "Renamed",
      groupIds: expect.arrayContaining([groupId, otherGroupId]),
    }));
  });

  it("locks the form and the save button when editing yourself", async () => {
    renderModal({ actorId: existingUser.id, user: existingUser });
    expect(screen.getByRole("alert")).toHaveTextContent("Bạn không thể sửa chính mình");
    expect(await screen.findByRole("checkbox", { name: "Vận hành" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("textbox", { name: /Họ và tên/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
  });
});

describe("user modal: update, name and scope", () => {
  it("leaves the name empty when the BE returns none", async () => {
    renderModal({ user: { ...existingUser, fullName: undefined }, actorId: "someone-else" });
    expect(screen.getByRole("textbox", { name: /Họ và tên/ })).toHaveValue("");
  });

  it("offers a scope change request instead of calling the scope read-only", async () => {
    renderModal({ user: existingUser, actorId: "someone-else" });
    expect(await screen.findByRole("button", { name: "Đề xuất đổi phạm vi" })).toBeInTheDocument();
    expect(screen.queryByText(/không thể tạo mới/)).not.toBeInTheDocument();
  });

  it("sends the chosen sub-merchants and reason, and needs a reason first", async () => {
    let body: unknown;
    mswServer.use(http.post("/api/v1/merchant/merchant-users/:id/scope-proposals", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ id: existingUser.id }, { status: 201 });
    }));
    renderModal({ user: existingUser, actorId: "someone-else" });
    await userEvent.click(await screen.findByRole("button", { name: "Đề xuất đổi phạm vi" }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Cửa hàng 1/ }));
    await userEvent.click(screen.getByRole("button", { name: "Gửi đề xuất" }));
    expect(await screen.findByText(/tối thiểu 10 ký tự/)).toBeInTheDocument();
    expect(body).toBeUndefined();
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do đề xuất/ }), "Phụ trách thêm cửa hàng mới");
    await userEvent.click(screen.getByRole("button", { name: "Gửi đề xuất" }));
    await waitFor(() => expect(body).toEqual({ subMerchantIds: [subMerchantId], reason: "Phụ trách thêm cửa hàng mới" }));
  });

  it("shows a pending proposal and blocks a second one", async () => {
    renderModal({ user: existingUser, actorId: "someone-else" }, {
      id: "77777777-7777-4777-8777-777777777777",
      merchantUserId: existingUser.id,
      status: "PENDING_APPROVAL",
      merchantIds: [merchantId],
      subMerchantIds: [subMerchantId],
      requestReason: "Phụ trách thêm cửa hàng mới",
      decisionReason: null,
      createdAt: "2026-10-08T10:00:00",
      decidedAt: null,
    });
    expect(await screen.findByText("Đang chờ duyệt")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Đề xuất đổi phạm vi" })).not.toBeInTheDocument();
  });

  it("hides the scope request when editing yourself", async () => {
    renderModal({ actorId: existingUser.id, user: existingUser });
    await screen.findByRole("checkbox", { name: "Vận hành" });
    expect(screen.queryByRole("button", { name: "Đề xuất đổi phạm vi" })).not.toBeInTheDocument();
  });
});

