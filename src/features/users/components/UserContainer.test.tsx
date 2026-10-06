// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { UserContainer } from "./UserContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/users" }));
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
  status: "ACTIVE",
  groupIds: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
  createdAt: "2026-10-05T10:00:00",
  updatedAt: "2026-10-05T10:00:00",
};
const base = "/api/v1/merchant/merchant-users";

function renderWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <UserContainer filter={{ page: 1, pageSize: 10 }} merchantIds={[merchantId]} actorId="actor" />
    </QueryClientProvider>,
  );
}

function renderContainer(status: "ACTIVE" | "LOCKED" = "ACTIVE") {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...row, status }], total: 1 })));
  return renderWithClient();
}

beforeEach(() => {
  mswServer.use(http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
    rows: [{ id: groupId, name: "Vận hành", merchantId }],
    total: 1,
  })));
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({
    rows: [{ id: subMerchantId, code: "S1", name: "Cửa hàng 1" }],
    total: 1,
  })));
});
afterEach(() => { cleanup(); push.mockClear(); });

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
    await userEvent.type(await screen.findByRole("textbox", { name: /Email/ }), "new@example.com");
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "New User");
    await userEvent.click(await screen.findByRole("checkbox", { name: "Vận hành" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(body).toMatchObject({ email: "new@example.com", fullName: "New User", groupIds: [groupId] }));
  });

  it("places duplicate-email errors beside the email field", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json({ message: "Email đã tồn tại" }, { status: 409 })));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Thêm người dùng/ }));
    await userEvent.type(await screen.findByRole("textbox", { name: /Email/ }), "user@example.com");
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "Test User");
    await userEvent.click(await screen.findByRole("checkbox", { name: "Vận hành" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Email đã tồn tại")).toBeInTheDocument();
  });

  it("locks with a reason", async () => {
    let lockBody: unknown;
    mswServer.use(http.post(`${base}/${userId}/lock`, async ({ request }) => {
      lockBody = await request.json();
      return HttpResponse.json({ ...row, status: "LOCKED" });
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Khoá Test User/ }));
    await userEvent.type(screen.getByRole("textbox", { name: /Lý do/ }), "Valid lock reason");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(lockBody).toEqual({ reason: "Valid lock reason" }));
  });

  it("unlocks with a plain confirmation and no reason", async () => {
    let unlockBody: string | undefined;
    mswServer.use(http.post(`${base}/${userId}/unlock`, async ({ request }) => {
      unlockBody = await request.text();
      return HttpResponse.json({ ...row, status: "ACTIVE" });
    }));
    renderContainer("LOCKED");
    await userEvent.click(await screen.findByRole("button", { name: /Mở khoá Test User/ }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
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
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết Test User/ }));
    expect(await screen.findByRole("region", { name: /Yêu cầu đổi phạm vi/ })).toHaveTextContent(proposal.requestReason);
    await userEvent.click(screen.getByRole("button", { name: "Duyệt đề xuất" }));
    await waitFor(() => expect(approved).toBe(true));
    expect(await screen.findByText("Đã duyệt")).toBeInTheDocument();
  });

  it("sends OTP when resetting a password without displaying secrets", async () => {
    let resetBody: unknown;
    mswServer.use(http.post(
      `${base}/${userId}/reset-password`,
      async ({ request }) => {
        resetBody = await request.json();
        return HttpResponse.json({ success: true, password: "secret-value", token: "secret-token" });
      },
    ));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Đặt lại mật khẩu Test User/ }));
    await userEvent.type(screen.getByRole("textbox", { name: "Mã phiên OTP" }), "session");
    await userEvent.type(screen.getByRole("textbox", { name: "Mã OTP" }), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(resetBody).toEqual({ otp: { otpSessionId: "session", otp: "123456" } });
    expect(screen.queryByText(/secret-value|secret-token/)).not.toBeInTheDocument();
  });

  it("reports which step succeeded when a later edit step fails", async () => {
    mswServer.use(http.put(`${base}/${userId}`, () => HttpResponse.json(row)));
    mswServer.use(http.post(
      `${base}/${userId}/assign-groups`,
      () => HttpResponse.json({ message: "Nhóm quyền lỗi" }, { status: 500 }),
    ));
    mswServer.use(http.get("/api/v1/merchant/permission-groups", () => HttpResponse.json({
      rows: [{ id: groupId, name: "Vận hành", merchantId }, { id: otherGroupId, name: "Kế toán", merchantId }],
      total: 2,
    })));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa Test User/ }));
    await userEvent.click(await screen.findByRole("checkbox", { name: "Kế toán" }));
    await userEvent.clear(screen.getByRole("textbox", { name: /Họ và tên/ }));
    await userEvent.type(screen.getByRole("textbox", { name: /Họ và tên/ }), "Renamed User");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Đã cập nhật thông tin");
    expect(alert).toHaveTextContent("Nhóm quyền lỗi");
  });
});
