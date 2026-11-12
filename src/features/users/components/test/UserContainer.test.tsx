// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { UserContainer } from "../UserContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/users", useSearchParams: () => new URLSearchParams() }));
const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "22222222-2222-4222-8222-222222222222";
const otherGroupId = "66666666-6666-4666-8666-666666666666";
const subMerchantId = "55555555-5555-4555-8555-555555555555";
const userId = "33333333-3333-4333-8333-333333333333";
const row = {
  id: userId,
  email: "user@example.com",
  fullName: "Test User",
  phone: null,
  active: true,
  locked: false,
  groups: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
  createdAt: "2026-10-05T10:00:00",
  updatedAt: "2026-10-05T10:00:00",
};
const base = "/api/v1/merchant/merchant-users";

function renderWithClient(actorId = "actor") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UserContainer filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantId]} actorId={actorId} canApproveScope />
    </QueryClientProvider>,
  );
}

function renderWithNamedMerchants() {
  const merchantB = "77777777-7777-4777-8777-777777777777";
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [row], total: 1 })));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UserContainer
        filter={{ page: 1, pageSize: 10 }}
        merchantIds={[merchantId, merchantB]}
        merchants={[{ id: merchantId, code: "MC000001", name: "Halo tech" }, { id: merchantB, code: "MC000002", name: "Green mart" }]}
        actorId="actor"
        canApproveScope
      />
    </QueryClientProvider>,
  );
}

function renderContainer(status: "ACTIVE" | "LOCKED" = "ACTIVE", actorId = "actor") {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...row, ...(status === "LOCKED" ? { active: false, locked: true } : {}) }], total: 1 })));
  return renderWithClient(actorId);
}

async function renderReadyContainer(status: "ACTIVE" | "LOCKED" = "ACTIVE", actorId = "actor") {
  renderContainer(status, actorId);
  await screen.findByText("Vận hành");
}

const openDialog = async () => within(await screen.findByRole("dialog"));

beforeEach(() => {
  mswServer.use(http.get(`${base}/:id/scope-proposal`, () => HttpResponse.json(null, { status: 404 })));
  mswServer.use(http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
    rows: [{ id: groupId, name: "Vận hành", merchantId, permissions: ["A"] }],
    total: 1,
  })));
  mswServer.use(http.get("/api/v1/merchant/merchant-users/assignable-groups", () => HttpResponse.json([
    { id: groupId, code: "OPS", name: "Vận hành", system: false, permissions: ["A"] },
  ])));
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([
    { id: subMerchantId, code: "S1", name: "Cửa hàng 1", status: "ACTIVE" },
  ])));
});
afterEach(() => {
  cleanup();
  mswServer.resetHandlers();
  push.mockClear();
});

describe("user container", () => {
  it("shows a busy indicator while the list loads", () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    renderWithClient();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("reports a list error and recovers on retry", async () => {
    let failing = true;
    mswServer.use(http.get(base, () => (
      failing
        ? HttpResponse.json({ message: "Không tải được" }, { status: 500 })
        : HttpResponse.json({ rows: [row], total: 1 })
    )));
    renderWithClient();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("creates a user with the chosen group", async () => {
    let body: unknown;
    mswServer.use(http.post(base, async ({ request }) => { body = await request.json(); return HttpResponse.json(row); }));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Thêm người dùng/ }));
    const dialog = await openDialog();
    await userEvent.type(await dialog.findByRole("textbox", { name: /Email/ }), "new@example.com");
    await userEvent.type(dialog.getByRole("textbox", { name: /Họ và tên/ }), "New User");
    await userEvent.click(await dialog.findByRole("checkbox", { name: "Vận hành" }));
    await userEvent.click(dialog.getByRole("button", { name: "Thêm người dùng" }));
    await waitFor(() => expect(body).toMatchObject({ email: "new@example.com", fullName: "New User", groupIds: [groupId], subMerchantIds: [] }));
  });

  it("places duplicate-email errors beside the email field", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json({ message: "Email đã tồn tại" }, { status: 409 })));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Thêm người dùng/ }));
    const dialog = await openDialog();
    await userEvent.type(await dialog.findByRole("textbox", { name: /Email/ }), "user@example.com");
    await userEvent.type(dialog.getByRole("textbox", { name: /Họ và tên/ }), "Test User");
    await userEvent.click(await dialog.findByRole("checkbox", { name: "Vận hành" }));
    await userEvent.click(dialog.getByRole("button", { name: "Thêm người dùng" }));
    await waitFor(() => expect(dialog.getByRole("textbox", { name: /Email/ })).toHaveAccessibleDescription("Email đã tồn tại"));
  });

  it("shows the user's name, email and the phone placeholder in the list", async () => {
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Test User")).toBeInTheDocument();
    expect(within(table).getByText("user@example.com")).toBeInTheDocument();
    expect(within(table).getByText("Chưa có")).toBeInTheDocument();
    expect(await within(table).findByText("Vận hành")).toBeInTheDocument();
  });

  it("locks with a reason", async () => {
    let lockBody: unknown;
    mswServer.use(http.post(`${base}/${userId}/lock`, async ({ request }) => {
      lockBody = await request.json();
      return HttpResponse.json({ ...row, active: false, locked: true });
    }));
    await renderReadyContainer();
    const lock = await screen.findByRole("button", { name: /Khóa Test User/ });
    expect(lock).toBeEnabled();
    await userEvent.click(lock);
    const dialog = await openDialog();
    const confirm = dialog.getByRole("button", { name: "Khóa tài khoản" });
    expect(confirm).toBeDisabled();
    await userEvent.type(dialog.getByRole("textbox", { name: /Lý do/ }), "Valid lock reason");
    await userEvent.click(confirm);
    await waitFor(() => expect(lockBody).toEqual({ reason: "Valid lock reason" }));
  });

  it("unlocks with a plain confirmation and no reason", async () => {
    let unlockBody: string | undefined;
    mswServer.use(http.post(`${base}/${userId}/unlock`, async ({ request }) => {
      unlockBody = await request.text();
      return HttpResponse.json(row);
    }));
    await renderReadyContainer("LOCKED");
    await userEvent.click(await screen.findByRole("button", { name: /Mở khóa Test User/ }));
    const dialog = await openDialog();
    expect(dialog.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Mở khóa" }));
    await waitFor(() => expect(unlockBody).toBe(""));
  });

  it("views and approves the scope proposal already created for a user", async () => {
    let approved = false;
    const proposal = {
      id: "77777777-7777-4777-8777-777777777777",
      merchantUserId: userId,
      status: "PENDING_APPROVAL",
      merchantIds: [merchantId],
      subMerchantIds: [subMerchantId],
      requestReason: "Cần thêm cửa hàng để vận hành",
      decisionReason: null,
      createdAt: "2026-10-05T10:00:00",
      decidedAt: null,
    };
    mswServer.use(
      http.get(`${base}/${userId}/scope-proposal`, () => HttpResponse.json({
        ...proposal,
        status: approved ? "APPROVED" : "PENDING_APPROVAL",
      })),
      http.post(`${base}/${userId}/scope-proposal/approve`, () => {
        approved = true;
        return HttpResponse.json({ ...proposal, status: "APPROVED" });
      }),
    );
    await renderReadyContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết Test User/ }));
    expect(await screen.findByRole("region", { name: /đề xuất/i })).toHaveTextContent(proposal.requestReason);
    await userEvent.click(screen.getByRole("button", { name: "Duyệt đề xuất" }));
    await waitFor(() => expect(approved).toBe(true));
    expect(await screen.findByText("Đã duyệt")).toBeInTheDocument();
  });

  it("resends the activation mail for a pending user after confirming", async () => {
    let called = false;
    mswServer.use(http.post(`${base}/${userId}/resend-activation`, () => {
      called = true;
      return HttpResponse.json({ id: userId });
    }));
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...row, active: false, locked: false }], total: 1 })));
    renderWithClient();
    await screen.findByText("Vận hành");
    await userEvent.click(await screen.findByRole("button", { name: /Gửi lại kích hoạt Test User/ }));
    const dialog = await openDialog();
    expect(dialog.getByText("user@example.com")).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Gửi lại email" }));
    await waitFor(() => expect(called).toBe(true));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("resets a password with no OTP and no request body, then confirms without showing secrets", async () => {
    let resetBody: string | undefined;
    mswServer.use(http.post(
      `${base}/${userId}/reset-password`,
      async ({ request }) => {
        resetBody = await request.text();
        return HttpResponse.json({ success: true, password: "secret-value", token: "secret-token" });
      },
    ));
    await renderReadyContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Đặt lại mật khẩu Test User/ }));
    const dialog = await openDialog();
    expect(dialog.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(await dialog.findByRole("status")).toHaveTextContent("Đã gửi yêu cầu đặt lại mật khẩu");
    expect(resetBody).toBe("");
    expect(screen.queryByText(/secret-value|secret-token/)).not.toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Xong" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the reset dialog open with an alert and a retry when the BE fails", async () => {
    let failing = true;
    mswServer.use(http.post(`${base}/${userId}/reset-password`, () => (
      failing ? HttpResponse.json({ message: "Hệ thống đang bận" }, { status: 503 }) : HttpResponse.json({ success: true })
    )));
    await renderReadyContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Đặt lại mật khẩu Test User/ }));
    const dialog = await openDialog();
    await userEvent.click(dialog.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent("Chưa gửi được yêu cầu. Hệ thống đang gặp sự cố, thử lại sau ít phút.");
    failing = false;
    await userEvent.click(dialog.getByRole("button", { name: "Thử lại" }));
    expect(await dialog.findByRole("status")).toBeInTheDocument();
  });

  it("does not offer reset password on the current user's own row", async () => {
    await renderReadyContainer("ACTIVE", userId);
    expect(await screen.findByRole("button", { name: /Đặt lại mật khẩu Test User/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Khóa Test User/ })).toBeDisabled();
  });

  it("opens reset password from the detail modal", async () => {
    await renderReadyContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết Test User/ }));
    const detail = await openDialog();
    await userEvent.click(detail.getByRole("button", { name: "Đặt lại mật khẩu" }));
    const reset = await screen.findByRole("heading", { name: "Đặt lại mật khẩu" });
    expect(reset).toBeInTheDocument();
  });

  it("reports which step succeeded when a later edit step fails", async () => {
    mswServer.use(http.put(`${base}/${userId}`, () => HttpResponse.json(row)));
    mswServer.use(http.post(
      `${base}/${userId}/assign-groups`,
      () => HttpResponse.json({ message: "Nhóm quyền lỗi" }, { status: 500 }),
    ));
    mswServer.use(http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [{ id: groupId, name: "Vận hành", merchantId, permissions: ["A"] }, { id: otherGroupId, name: "Kế toán", merchantId, permissions: ["A"] }],
      total: 2,
    })));
    mswServer.use(http.get("/api/v1/merchant/merchant-users/assignable-groups", () => HttpResponse.json([
      { id: groupId, code: "OPS", name: "Vận hành", system: false, permissions: ["A"] },
      { id: otherGroupId, code: "ACC", name: "Kế toán", system: false, permissions: ["A"] },
    ])));
    await renderReadyContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa Test User/ }));
    const dialog = await openDialog();
    await userEvent.click(await dialog.findByRole("checkbox", { name: "Kế toán" }));
    await userEvent.clear(dialog.getByRole("textbox", { name: /Họ và tên/ }));
    await userEvent.type(dialog.getByRole("textbox", { name: /Họ và tên/ }), "Renamed User");
    await userEvent.click(dialog.getByRole("button", { name: "Lưu thay đổi" }));
    const alert = await dialog.findByRole("alert");
    expect(alert).toHaveTextContent("Đã cập nhật thông tin");
    expect(alert).toHaveTextContent("Nhóm quyền lỗi");
  });

  it("offers a second add-user action in the empty result state", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0 })));
    renderWithClient();

    expect(await screen.findByText("Không có người dùng phù hợp. Đổi bộ lọc hoặc thêm người dùng mới.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Thêm người dùng" })).toHaveLength(2);
  });

  it("lets the creator pick the merchant by name in the create dialog", async () => {
    renderWithNamedMerchants();
    await screen.findByText("Vận hành");
    await userEvent.click(screen.getAllByRole("button", { name: /Thêm người dùng/ })[0]!);
    const dialog = await openDialog();
    await userEvent.click(dialog.getByRole("combobox"));
    expect(await screen.findByRole("option", { name: /Green mart/ })).toBeInTheDocument();
  });
});
