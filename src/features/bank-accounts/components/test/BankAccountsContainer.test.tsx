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
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/bank-accounts" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

vi.mock("../../constants/capabilities", () => ({ BANK_ACCOUNT_WRITES_ENABLED: true }));

const base = "/api/v1/admin/bank-accounts";
const merchantId = "11111111-1111-4111-8111-111111111111";
const account: BankAccount = {
  id: "55555555-5555-4555-8555-555555555555",
  version: 4,
  merchantId,
  subMerchantId: null,
  bankCode: "VCB",
  accountNumber: "******7890",
  accountName: "CONG TY A",
  branchName: "Ha Noi",
  isDefault: false,
  status: "ACTIVE",
  linkStatus: "LINKED",
};
// The dormant write flow edits a full number; the list/detail the portal BE serves today are masked.
const editable = { ...account, accountNumber: "1234567890" };
const challenge = { otpSessionId: "session-1", maskedRecipient: "0912•••678", expiresInSeconds: 300, canResendAfterSeconds: 60 };
const filter = { page: 1, pageSize: 10, merchantId };

function renderContainer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BankAccountsContainer filter={filter} />
    </QueryClientProvider>,
  );
}

const listReturns = (rows: BankAccount[]) =>
  mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

async function fillNewAccount() {
  await userEvent.click(screen.getByRole("button", { name: /Thêm tài khoản mới/ }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(within(dialog).getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name: "Vietcombank" }));
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tài khoản/ }), "1234567890");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Chủ tài khoản/ }), "CONG TY A");
  await userEvent.click(within(dialog).getByRole("button", { name: "Gửi liên kết và xác minh" }));
}

beforeEach(() => {
  listReturns([account]);
  mswServer.use(http.post(`${base}/otp-challenge`, () => HttpResponse.json(challenge)));
  mswServer.use(http.get(`${base}/${account.id}`, () => HttpResponse.json(editable)));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("bank accounts container", () => {
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

  it("names the row actions by bank and masked number, never by id", async () => {
    renderContainer();
    await screen.findByText("******7890");
    const names = screen.getAllByRole("button").map((button) => button.getAttribute("aria-label") ?? "");
    const rowActions = names.filter((name) => name.includes("******7890"));
    expect(rowActions).toHaveLength(4);
    expect(rowActions.join(" ")).not.toContain(account.id);
  });

  it("adds an account: OTP dialog, six digits, create with the OTP, then closes", async () => {
    let body: unknown;
    mswServer.use(http.post(base, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ account, applied: true, pendingChangeRequest: null }, { status: 201 });
    }));
    renderContainer();
    await screen.findByText("******7890");
    await fillNewAccount();
    expect(await screen.findByText(/0912•••678/)).toBeInTheDocument();
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    await waitFor(() => expect(body).toMatchObject({
      bankCode: "VCB",
      accountNumber: "1234567890",
      accountName: "CONG TY A",
      otp: { otpSessionId: "session-1", otp: "123456" },
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
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
    expect(bodies[0]).toMatchObject({ otp: { otp: "654321" } });
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

  it("edits a branch name without asking for an OTP", async () => {
    let challenged = false;
    let body: unknown;
    mswServer.use(http.post(`${base}/otp-challenge`, () => {
      challenged = true;
      return HttpResponse.json(challenge);
    }));
    mswServer.use(http.put(`${base}/${account.id}`, async ({ request }) => {
      body = await request.json();
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
    expect(challenged).toBe(false);
  });

  it("shows a pending badge after changing a linked account", async () => {
    mswServer.use(http.put(`${base}/${account.id}`, () => HttpResponse.json({
      account,
      applied: false,
      pendingChangeRequest: { id: "66666666-6666-4666-8666-666666666666", bankAccountId: account.id, changeType: "UPDATE_ACCOUNT", status: "PENDING" },
    })));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Sửa tài khoản/ }));
    const number = await screen.findByRole("textbox", { name: /Số tài khoản/ });
    await userEvent.clear(number);
    await userEvent.type(number, "9999999999");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await screen.findByText(/0912•••678/);
    await typeCode("123456");
    await userEvent.click(screen.getByRole("button", { name: "Xác nhận" }));
    expect(await screen.findByText("Chờ duyệt")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sửa tài khoản/ })).toBeDisabled();
  });

  it("offers a reload when the version is stale and refetches the account", async () => {
    let detailReads = 0;
    mswServer.use(http.get(`${base}/${account.id}`, () => {
      detailReads += 1;
      return HttpResponse.json({ ...editable, version: 4 + detailReads });
    }));
    mswServer.use(http.put(`${base}/${account.id}`, () => HttpResponse.json(
      { message: "Dữ liệu đã thay đổi", code: "VERSION_CONFLICT" },
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

  it("deletes an account and keeps a BE refusal visible in the dialog", async () => {
    mswServer.use(http.delete(`${base}/${account.id}`, () => HttpResponse.json(
      { message: "Tài khoản đã phát sinh giao dịch" },
      { status: 400 },
    )));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xoá tài khoản/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Xoá tài khoản" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Tài khoản đã phát sinh giao dịch");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("searches on Enter and clears the filters", async () => {
    renderContainer();
    await screen.findByText("******7890");
    await userEvent.click(screen.getAllByRole("combobox")[0]!);
    await userEvent.click(await screen.findByRole("option", { name: "Đã liên kết" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10&linkStatus=LINKED");
    await userEvent.click(screen.getByRole("button", { name: "Xóa lọc" }));
    expect(push).toHaveBeenLastCalledWith("/bank-accounts?page=1&pageSize=10");
  });
});
