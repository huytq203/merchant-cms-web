// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { BankAccountsContainer } from "../BankAccountsContainer";
import type { BankAccount } from "../../types";

const push = vi.fn();
const toastSuccess = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/bank-accounts", useSearchParams: () => new URLSearchParams() }));
vi.mock("sonner", () => ({ toast: { success: (message: string) => toastSuccess(message) } }));

const base = "/api/v1/admin/bank-accounts";
const merchantId = "11111111-1111-4111-8111-111111111111";
const sub1 = { id: "77777777-7777-4777-8777-777777777777", code: "SUB01", name: "Chi nhanh 1", status: "ACTIVE" };
const sub2 = { id: "88888888-8888-4888-8888-888888888888", code: "SUB02", name: "Chi nhanh 2", status: "ACTIVE" };
const sub3 = { id: "99999999-9999-4999-8999-999999999999", code: "SUB03", name: "Chi nhanh 3", status: "ACTIVE" };
const assigned = (...subs: (typeof sub1)[]) => subs.map(({ id, code, name }) => ({ id, code, name }));
const account: BankAccount = {
  id: "55555555-5555-4555-8555-555555555555",
  version: 4,
  merchantId,
  bankCode: "VCB",
  accountNumber: "******7890",
  accountName: "CONG TY A",
  branchName: "Ha Noi",
  isDefault: false,
  accountStatus: "PENDING_VERIFICATION",
  payable: true,
  assignedSubMerchants: assigned(sub1),
};
// Edits are tested against a full number so a changed number can be typed over it.
const editable = { ...account, accountNumber: "1234567890" };
const challenge = { otpSessionId: "session-1", maskedRecipient: "0912•••678", expiresInSeconds: 300, canResendAfterSeconds: 60 };
const filter = { page: 1, pageSize: 10, merchantId };

function renderContainer(canManage = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BankAccountsContainer filter={filter} canManage={canManage} />
    </QueryClientProvider>,
  );
}

const listReturns = (rows: BankAccount[]) =>
  mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

async function fillNewAccount(options: { subs?: RegExp[]; confirmMove?: boolean } = {}) {
  await userEvent.click(screen.getByRole("button", { name: /Thêm tài khoản/ }));
  const dialog = await screen.findByRole("dialog");
  for (const sub of options.subs ?? []) {
    await userEvent.click(await within(dialog).findByRole("checkbox", { name: sub }));
  }
  await userEvent.click(within(dialog).getByRole("combobox", { name: /Ngân hàng/ }));
  await userEvent.click(await screen.findByRole("option", { name: "Vietcombank" }));
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tài khoản/ }), "1234567890");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Chủ tài khoản/ }), "CONG TY A");
  if (options.confirmMove) await userEvent.click(within(dialog).getByRole("checkbox", { name: /Tôi xác nhận chuyển/ }));
  await userEvent.click(within(dialog).getByRole("button", { name: "Lưu tài khoản" }));
}

beforeEach(() => {
  listReturns([account]);
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([sub1, sub2, sub3])));
  mswServer.use(http.post(`${base}/otp-challenge`, () => HttpResponse.json(challenge)));
  mswServer.use(http.get(`${base}/${account.id}`, () => HttpResponse.json(editable)));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("bank accounts container", () => {
  it("only lets a read-only session view accounts", async () => {
    renderContainer(false);
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Thêm tài khoản/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Sửa tài khoản/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mặc định/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xoá tài khoản/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem tài khoản/ })).toBeInTheDocument();
  });

  it("offers no lock or unlock: the Portal cannot lock an account", async () => {
    listReturns([{ ...account, accountStatus: "LOCKED", payable: false }]);
    renderContainer();
    await screen.findByText("******7890");
    expect(screen.queryByRole("button", { name: /Khóa|Mở khóa/ })).not.toBeInTheDocument();
  });

  it("shows loading, error, empty and data states", async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    renderContainer();
    expect(await screen.findByRole("status")).toHaveAttribute("aria-busy", "true");
    cleanup();
    mswServer.use(http.get(base, () => HttpResponse.json({ message: "Không tải được" }, { status: 500 })));
    renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    cleanup();
    listReturns([]);
    renderContainer();
    expect(await screen.findByText("Chưa có tài khoản ngân hàng")).toBeInTheDocument();
    cleanup();
    listReturns([account]);
    renderContainer();
    expect(await screen.findByText("******7890")).toBeInTheDocument();
    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
  });

  it("has the v2 columns and no 'Áp dụng cho' level column", async () => {
    renderContainer();
    const table = await screen.findByRole("table");
    for (const header of ["Sub-merchant đang dùng", "Ngân hàng", "Số tài khoản", "Chủ tài khoản", "Mặc định", "Trạng thái tài khoản"]) {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    }
    expect(within(table).queryByRole("columnheader", { name: "Áp dụng cho" })).not.toBeInTheDocument();
  });

  it("shows at most two Sub names then +N, with every name in a tooltip; no Sub reads 'Chưa gán'", async () => {
    listReturns([
      { ...account, assignedSubMerchants: assigned(sub1, sub2, sub3) },
      { ...account, id: "66666666-6666-4666-8666-666666666666", accountNumber: "******2111", assignedSubMerchants: [] },
    ]);
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Chi nhanh 1")).toBeInTheDocument();
    expect(within(table).getByText("Chi nhanh 2")).toBeInTheDocument();
    expect(within(table).queryByText("Chi nhanh 3")).not.toBeInTheDocument();
    const more = within(table).getByText("+1");
    await userEvent.hover(more);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Chi nhanh 1");
    expect(tooltip).toHaveTextContent("Chi nhanh 3");
    expect(within(table).getByText("Chưa gán")).toBeInTheDocument();
  });

  it("colours the account status: pending orange, verified green, locked red", async () => {
    listReturns([
      account,
      { ...account, id: "66666666-6666-4666-8666-666666666666", accountStatus: "VERIFIED" },
      { ...account, id: "67777777-6666-4666-8666-666666666666", accountStatus: "LOCKED", payable: false },
    ]);
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Chờ xác minh")).toHaveClass("text-warning");
    expect(within(table).getByText("Đã xác minh")).toHaveClass("text-success");
    expect(within(table).getByText("Khóa")).toHaveClass("text-danger");
  });

  it("marks the default account in its own column", async () => {
    listReturns([{ ...account, isDefault: true }]);
    renderContainer();
    const table = await screen.findByRole("table");
    // Một lần ở tiêu đề cột, một lần ở badge của dòng.
    expect(within(table).getAllByRole("cell").some((cell) => cell.textContent === "Mặc định")).toBe(true);
  });

  it("names the row actions by bank and masked number, never by id", async () => {
    renderContainer();
    await screen.findByText("******7890");
    const names = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label") ?? "");
    const rowActions = names.filter((name) => name.includes("******7890"));
    expect(rowActions).toHaveLength(4);
    expect(rowActions.join(" ")).not.toContain(account.id);
  });

  it("adds an account for the chosen Subs: OTP dialog, six digits, create with the OTP, then closes", async () => {
    let body: Record<string, unknown> = {};
    mswServer.use(http.post(base, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ account, applied: true }, { status: 201 });
    }));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount({ subs: [/SUB01/, /SUB02/], confirmMove: true });
    expect(await screen.findByText(/0912•••678/)).toBeInTheDocument();
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(body).toMatchObject({
      bankCode: "VCB",
      accountNumber: "1234567890",
      accountName: "CONG TY A",
      assignSubMerchantIds: [sub1.id, sub2.id],
      otp: { otpSessionId: "session-1", otp: "123456" },
    }));
    expect(body).not.toHaveProperty("subMerchantId");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("has no level picker in the form and warns that a Sub using another account is moved", async () => {
    renderContainer();
    await screen.findByText("******7890");
    await userEvent.click(screen.getByRole("button", { name: /Thêm tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Cấp Sub-merchant" })).not.toBeInTheDocument();
    expect(within(dialog).queryByText("Áp dụng cho")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/đang dùng tài khoản khác sẽ chuyển sang tài khoản này/)).toBeInTheDocument();
  });

  it("names the account a Sub already uses and asks to confirm moving it before the OTP", async () => {
    const otpRequests: unknown[] = [];
    mswServer.use(http.post(`${base}/otp-challenge`, () => {
      otpRequests.push(1);
      return HttpResponse.json(challenge);
    }));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount({ subs: [/SUB01/] });
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText(/đang dùng Vietcombank \*{6}7890/).length).toBeGreaterThan(0);
    expect(await within(dialog).findByText("Vui lòng xác nhận chuyển Sub-merchant trước khi lưu")).toBeInTheDocument();
    expect(otpRequests).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Tôi xác nhận chuyển/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu tài khoản" }));
    expect(await screen.findByText(/0912•••678/)).toBeInTheDocument();
  });

  it("asks again when the Subs to move change after confirming", async () => {
    const other = { ...account, id: "66666666-6666-4666-8666-666666666666", accountNumber: "******1111", assignedSubMerchants: assigned(sub2) };
    listReturns([account, other]);
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount({ subs: [/SUB01/], confirmMove: true });
    expect(await screen.findByText(/0912•••678/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Quay lại|Hủy/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /SUB02/ }));
    expect(within(dialog).getByRole("checkbox", { name: /Tôi xác nhận chuyển/ })).not.toBeChecked();
  });

  it("does not let a locked account take new Subs, but its Subs can still be removed", async () => {
    const locked = { ...editable, accountStatus: "LOCKED" as const, payable: false };
    listReturns([locked]);
    mswServer.use(http.get(`${base}/${account.id}`, () => HttpResponse.json(locked)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("checkbox", { name: /SUB01/ })).not.toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByRole("checkbox", { name: /SUB02/ })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByText(/đang bị khóa nên không gán thêm Sub-merchant/)).toBeInTheDocument();
  });

  it("submits right away when a full six-digit code is pasted", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ account, applied: true });
    }));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount();
    await screen.findByText(/0912•••678/);
    await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
    await userEvent.paste("654321");
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ otp: { otp: "654321" }, assignSubMerchantIds: [] });
  });

  it("keeps the OTP dialog open and shows the error for a wrong code", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json(
      { success: false, message: "wrong", code: "MERCHANT_SENSITIVE_OTP_INVALID" },
      { status: 400 },
    )));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount();
    await screen.findByText(/0912•••678/);
    await typeCode("111111");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Mã OTP không đúng/);
    expect(screen.getByRole("textbox", { name: "Digit 1 of 6" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the code step and shows a holder name the bank does not confirm (5804) under the holder field", async () => {
    const mismatch = "Tên chủ tài khoản không khớp tên chủ tài khoản tại ngân hàng. Vui lòng kiểm tra lại";
    mswServer.use(http.post(base, () => HttpResponse.json({ success: false, message: mismatch, code: "5804" }, { status: 400 })));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount();
    await screen.findByText(/0912•••678/);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    const holder = await screen.findByRole("textbox", { name: /Chủ tài khoản/ });
    expect(holder).toHaveValue("CONG TY A");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText(mismatch)).toHaveLength(1);
    expect(holder).toHaveClass("border-danger");
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Digit 1 of 6" })).not.toBeInTheDocument();
    await userEvent.type(holder, "B");
    expect(within(dialog).queryByText(mismatch)).not.toBeInTheDocument();
    expect(within(dialog).getByText("Tên phải trùng tên pháp nhân đã xác thực KYB và tên chủ tài khoản tại ngân hàng")).toBeInTheDocument();
  });

  it("closes the code step when the bank name inquiry fails (5803), keeping what was typed", async () => {
    const inquiry = "Chưa tra cứu được tên chủ tài khoản từ ngân hàng. Vui lòng kiểm tra lại ngân hàng, số tài khoản và thử lại sau";
    mswServer.use(http.post(base, () => HttpResponse.json({ success: false, message: inquiry, code: "MERCHANT_BANK_ACCOUNT_HOLDER_INQUIRY_UNAVAILABLE" }, { status: 400 })));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount();
    await screen.findByText(/0912•••678/);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    const holder = await screen.findByRole("textbox", { name: /Chủ tài khoản/ });
    expect(within(screen.getByRole("dialog")).getByText(inquiry)).toBeInTheDocument();
    expect(holder).toHaveClass("border-danger");
    expect(screen.getByRole("textbox", { name: /Số tài khoản/ })).toHaveValue("1234567890");
  });

  it("shows a BE refusal of the Sub list word for word (5755: a Sub still has a withdrawal in progress)", async () => {
    const message = "Sub-merchant SUB01 còn lệnh rút tiền đang xử lý, chưa thể gỡ khỏi tài khoản";
    mswServer.use(http.put(`${base}/${account.id}`, () => HttpResponse.json({ message, code: "5755" }, { status: 409 })));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(await within(dialog).findByRole("checkbox", { name: /SUB01/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await screen.findByText(/0912•••678/);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("edits a branch name without asking for an OTP", async () => {
    let challenged = false;
    let body: Record<string, unknown> = {};
    mswServer.use(http.post(`${base}/otp-challenge`, () => {
      challenged = true;
      return HttpResponse.json(challenge);
    }));
    mswServer.use(http.put(`${base}/${account.id}`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ account, applied: true });
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const branch = await screen.findByRole("textbox", { name: /Chi nhánh/ });
    await userEvent.clear(branch);
    await userEvent.type(branch, "Hai Phong");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(body).toMatchObject({ version: 4, branchName: "Hai Phong" }));
    expect(body).not.toHaveProperty("otp");
    expect(body).not.toHaveProperty("assignSubMerchantIds");
    expect(challenged).toBe(false);
  });

  it("changes the Subs with an OTP, applies right away and shows no 'pending approval' badge", async () => {
    let body: Record<string, unknown> = {};
    const saved = { ...account, assignedSubMerchants: assigned(sub1, sub2) };
    mswServer.use(http.put(`${base}/${account.id}`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      listReturns([saved]);
      return HttpResponse.json({ account: saved, applied: true, pendingChangeRequest: null });
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByRole("checkbox", { name: /SUB01/ })).toBeChecked();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /SUB02/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu thay đổi" }));
    await screen.findByText(/0912•••678/);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(body).toMatchObject({
      version: 4, assignSubMerchantIds: [sub1.id, sub2.id], otp: { otpSessionId: "session-1", otp: "123456" },
    }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Cập nhật tài khoản thành công"));
    expect(await screen.findByText("Chi nhanh 2")).toBeInTheDocument();
    expect(screen.queryByText("Chờ duyệt")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sửa tài khoản/ })).toBeEnabled();
  });

  it("keeps an untouched masked number out of the request so it is not read as a change", async () => {
    let body: Record<string, unknown> = {};
    mswServer.use(http.get(`${base}/${account.id}`, () => HttpResponse.json(account)));
    mswServer.use(http.put(`${base}/${account.id}`, async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ account, applied: true });
    }));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const branch = await screen.findByRole("textbox", { name: /Chi nhánh/ });
    await userEvent.clear(branch);
    await userEvent.type(branch, "Da Nang");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() => expect(body).toMatchObject({ branchName: "Da Nang" }));
    expect(body).not.toHaveProperty("accountNumber");
  });

  it("shows the Subs using the account and when it was verified in the detail", async () => {
    const verified = { ...account, accountStatus: "VERIFIED" as const, verifiedAt: "2026-11-18T09:30:00", assignedSubMerchants: assigned(sub1, sub2) };
    listReturns([verified]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("SUB01 - Chi nhanh 1")).toBeInTheDocument();
    expect(within(dialog).getByText("SUB02 - Chi nhanh 2")).toBeInTheDocument();
    expect(within(dialog).getByText("Đã xác minh")).toBeInTheDocument();
    expect(within(dialog).getByText("18/11/2026 09:30")).toBeInTheDocument();
    expect(within(dialog).queryByText(/chờ Flexpay phê duyệt/)).not.toBeInTheDocument();
  });

  it("keeps the verification time of a locked account and says it cannot withdraw", async () => {
    listReturns([{ ...account, accountStatus: "LOCKED", payable: false, verifiedAt: "2026-11-18T09:30:00" }]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("18/11/2026 09:30")).toBeInTheDocument();
    expect(within(dialog).getByText("Rút tiền được")).toBeInTheDocument();
    expect(within(dialog).queryByText("Nhận được thanh toán")).not.toBeInTheDocument();
  });

  it("does not show a verification time for an account that is not verified", async () => {
    listReturns([{ ...account, assignedSubMerchants: [] }]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem tài khoản/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText("Thời điểm xác minh")).not.toBeInTheDocument();
    expect(within(dialog).getByText("Chưa gán")).toBeInTheDocument();
  });

  it("filters by assignment and account status and clears them", async () => {
    renderContainer();
    await screen.findByText("******7890");
    await userEvent.click(screen.getByRole("combobox", { name: /Trạng thái gán/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Chưa gán" }));
    await userEvent.click(screen.getByRole("combobox", { name: /Trạng thái tài khoản/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Khóa" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10&assignmentStatus=UNASSIGNED&accountStatus=LOCKED");
    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10");
  });

  it("searches by number, holder or bank and clears the search", async () => {
    renderContainer();
    await screen.findByText("******7890");
    await userEvent.type(screen.getByRole("textbox", { name: /Tìm kiếm/ }), " 7890 ");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10&query=7890");
    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10");
  });

  it("asks the BFF with the v2 filters", async () => {
    const queries: string[] = [];
    mswServer.use(http.get(base, ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({ rows: [account], total: 1 });
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <BankAccountsContainer filter={{ ...filter, assignmentStatus: "ASSIGNED", accountStatus: "VERIFIED" }} canManage />
      </QueryClientProvider>,
    );
    await screen.findByText("******7890");
    expect(queries[0]).toContain("assignmentStatus=ASSIGNED");
    expect(queries[0]).toContain("accountStatus=VERIFIED");
    expect(queries[0]).not.toContain("linkStatus");
  });

  it("filters by Sub-merchant and clears it with the other filters", async () => {
    renderContainer();
    await screen.findByText("******7890");
    await userEvent.click(screen.getByRole("button", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Chi nhanh 1/ }));
    await userEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith(`/bank-accounts?page=1&pageSize=10&subMerchantIds=${sub1.id}`);
    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10");
  });

  it("offers a reload when the version is stale and refetches the account", async () => {
    let detailReads = 0;
    mswServer.use(http.get(`${base}/${account.id}`, () => {
      detailReads += 1;
      return HttpResponse.json({ ...editable, version: 4 + detailReads });
    }));
    mswServer.use(http.put(`${base}/${account.id}`, () => HttpResponse.json(
      { message: "Dữ liệu đã thay đổi", code: "5758" },
      { status: 409 },
    )));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const branch = await screen.findByRole("textbox", { name: /Chi nhánh/ });
    await userEvent.type(branch, " 2");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    const reload = await screen.findByRole("button", { name: "Tải lại dữ liệu" });
    await userEvent.click(reload);
    await waitFor(() => expect(detailReads).toBe(2));
  });

  it("does not offer to delete an account still used by a Sub", async () => {
    renderContainer();
    const remove = await screen.findByRole("button", { name: /Xoá tài khoản/ });
    expect(remove).toBeDisabled();
  });

  it("deletes an account and keeps a BE refusal visible in the dialog, word for word", async () => {
    listReturns([{ ...account, assignedSubMerchants: [] }]);
    const message = "Tài khoản đang được gán cho Sub-merchant, hãy gỡ Sub-merchant trước khi xóa";
    mswServer.use(http.delete(`${base}/${account.id}`, () => HttpResponse.json({ message, code: "5756" }, { status: 409 })));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xoá tài khoản/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Xoá tài khoản" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
