// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { WithdrawalsContainer } from "../WithdrawalsContainer";
import type { Withdrawal, WithdrawalBankOption, WithdrawalListFilter } from "../../types/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/withdrawal" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/withdrawals";
const merchantId = "22222222-2222-4222-8222-222222222222";
const filter: WithdrawalListFilter = { page: 1, pageSize: 10 };
const abilities = { canCreate: true };
const bankOption: WithdrawalBankOption = {
  id: "44444444-4444-4444-8444-444444444444",
  bankCode: "VCB",
  accountNumberMasked: "xxxx1789",
  accountName: "CONG TY A",
  isDefault: true,
  subMerchantId: null,
};
const makeWithdrawal = (overrides: Partial<Withdrawal> = {}): Withdrawal => ({
  id: "33333333-3333-4333-8333-333333333333",
  merchantId,
  transactionCode: "WD2601",
  requestType: "MANUAL",
  amount: 5_000_000,
  fee: 5_500,
  currency: "VND",
  bankCode: "VCB",
  bankAccountMasked: "xxxx1789",
  bankAccountName: "CONG TY A",
  status: "PENDING",
  bankRefId: null,
  reason: "Rút doanh thu",
  createdAt: "2026-01-13T09:30:00",
  updatedAt: null,
  ...overrides,
});
const pending = makeWithdrawal();
const balance = { merchantId, availableBalance: 128_450_000, heldBalance: 200_000, dailyLimitRemaining: 500_000_000, minimumAmount: 10_000, maximumAmount: null };
const challenge = { otpSessionId: "session-1", maskedRecipient: "ow***@example.com", expiresInSeconds: 300, canResendAfterSeconds: 60 };

function renderContainer(props: Partial<{ abilities: typeof abilities }> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WithdrawalsContainer filter={filter} abilities={props.abilities ?? abilities} />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Withdrawal[]) {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));
}

beforeEach(() => {
  listReturns([pending]);
  mswServer.use(
    http.get(`${base}/bank-options`, () => HttpResponse.json({ options: [bankOption], hasHiddenSubMerchantAccounts: false })),
    http.get(`${base}/balance`, () => HttpResponse.json(balance)),
    http.post(`${base}/otp-challenge`, () => HttpResponse.json(challenge)),
    http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })),
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function openCreateModal() {
  await userEvent.click(screen.getByRole("button", { name: /Tạo yêu cầu rút tiền/ }));
  return screen.findByRole("dialog");
}

async function fillStepOne(dialog: HTMLElement, amountText = "250000") {
  await userEvent.click(within(dialog).getByRole("combobox", { name: /Tài khoản nhận/ }));
  await userEvent.click(await screen.findByRole("option", { name: /Vietcombank/ }));
  const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
  await userEvent.clear(amount);
  await userEvent.type(amount, amountText);
}

async function goToCode(dialog: HTMLElement, amountText = "250000") {
  await fillStepOne(dialog, amountText);
  await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
  await userEvent.click(await within(dialog).findByRole("button", { name: "Tiếp tục" }));
  await within(dialog).findByRole("textbox", { name: "Digit 1 of 6" });
}

async function typeCode(code = "123456") {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

async function sendWithCode(dialog: HTMLElement) {
  await typeCode();
  await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
}

describe("withdrawals container states", () => {
  it("shows loading, error, empty and data states", async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status")).toBeInTheDocument();
    loading.unmount();
    mswServer.use(http.get(base, () => HttpResponse.json({ message: "Không tải được" }, { status: 500 })));
    const error = renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    error.unmount();
    listReturns([]);
    const empty = renderContainer();
    expect(await screen.findByText("Chưa có yêu cầu rút tiền")).toBeInTheDocument();
    empty.unmount();
    listReturns([pending]);
    renderContainer();
    expect(await screen.findByText("WD2601")).toBeInTheDocument();
    expect(screen.getByText("xxxx1789", { exact: false })).toBeInTheDocument();
  });

  it("hides the create button without CREATE_WITHDRAWAL", async () => {
    renderContainer({ abilities: { canCreate: false } });
    await screen.findByText("WD2601");
    expect(screen.queryByRole("button", { name: /Tạo yêu cầu rút tiền/ })).not.toBeInTheDocument();
  });
});

describe("balance and filters", () => {
  it("shows the available balance, what is held and today's limit above the list", async () => {
    renderContainer();
    await screen.findByText("WD2601");
    expect(await screen.findByText(/128\.450\.000/)).toBeInTheDocument();
    expect(screen.getByText(/500\.000\.000/)).toBeInTheDocument();
  });

  it("says the balance could not be read instead of showing zero, and still lists the requests", async () => {
    mswServer.use(http.get(`${base}/balance`, () => HttpResponse.json({ message: "x" }, { status: 503 })));
    renderContainer();
    expect(await screen.findByText("WD2601")).toBeInTheDocument();
    expect(await screen.findByText(/Chưa đọc được số dư ví/)).toBeInTheDocument();
  });

  it("searches by code, stage and day and puts them in the URL", async () => {
    renderContainer();
    await screen.findByText("WD2601");
    const filter = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await userEvent.type(within(filter).getByRole("textbox", { name: "Mã giao dịch" }), "WD26");
    await userEvent.click(within(filter).getByRole("combobox", { name: /Trạng thái/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Đang xử lý" }));
    await userEvent.click(within(filter).getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls.at(-1)?.[0]), "http://localhost");
    expect(url.searchParams.get("transactionCode")).toBe("WD26");
    expect(url.searchParams.get("status")).toBe("PROCESSING");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("offers five stages instead of the fourteen BE statuses", async () => {
    renderContainer();
    await screen.findByText("WD2601");
    await userEvent.click(within(screen.getByRole("form", { name: "Bộ lọc tìm kiếm" })).getByRole("combobox", { name: /Trạng thái/ }));
    expect(within(await screen.findByRole("listbox")).getAllByRole("option")).toHaveLength(5);
  });
});

describe("create withdrawal modal", () => {
  it("blocks a zero amount on step one without moving on or calling the server", async () => {
    const posted = vi.fn();
    mswServer.use(http.post(base, () => {
      posted();
      return HttpResponse.json(pending, { status: 201 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await fillStepOne(dialog, "0");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText("Số tiền phải lớn hơn 0")).toBeInTheDocument();
    expect(posted).not.toHaveBeenCalled();
  });

  it("requires a bank account before the review step", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tiền/ }), "1000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText("Chọn tài khoản ngân hàng nhận tiền")).toBeInTheDocument();
  });

  it("checks the amount against the balance and the daily limit before asking for a code", async () => {
    const challenged = vi.fn();
    mswServer.use(http.post(`${base}/otp-challenge`, () => {
      challenged();
      return HttpResponse.json(challenge);
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await within(dialog).findByText(/128\.450\.000/);
    await fillStepOne(dialog, "200000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/vượt số dư khả dụng/)).toBeInTheDocument();
    expect(challenged).not.toHaveBeenCalled();
  });

  it("groups the amount while typing and fills the most that can be withdrawn", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
    await userEvent.type(amount, "1500000");
    expect(amount).toHaveValue("1.500.000");
    await userEvent.click(await within(dialog).findByRole("button", { name: "Rút tối đa" }));
    expect(amount).toHaveValue("128.450.000");
  });

  it("goes review, email code, then posts the body with the code once and shows the result", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json(makeWithdrawal({ amount: 250000, fee: 275 }), { status: 201 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await fillStepOne(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/xxxx1789/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/ow\*\*\*@example\.com/)).toBeInTheDocument();
    await typeCode();
    await userEvent.dblClick(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    expect(await screen.findByRole("heading", { name: "Đã gửi yêu cầu rút tiền" })).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(["amount", "bankAccountId", "idempotencyKey", "otp"]);
    expect(bodies[0]).toMatchObject({
      bankAccountId: bankOption.id, amount: 250000, otp: { otpSessionId: "session-1", otp: "123456" },
    });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("shows a wrong code on the code step and keeps what was entered", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json({ message: "Mã OTP không đúng" }, { status: 400 })));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog, "999000");
    await sendWithCode(dialog);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Mã OTP không đúng");
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    expect(within(dialog).getByRole("textbox", { name: /Số tiền/ })).toHaveValue("999.000");
  });

  it("retries a failed send with the same key and sends a new key when the amount changed", async () => {
    const keys: string[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      keys.push(((await request.json()) as { idempotencyKey: string }).idempotencyKey);
      return HttpResponse.json({ message: "Số dư không đủ" }, { status: 400 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog, "1000000");
    await sendWithCode(dialog);
    await within(dialog).findByRole("alert");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
    await userEvent.clear(amount);
    await userEvent.type(amount, "2000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Tiếp tục" }));
    await within(dialog).findByRole("textbox", { name: "Digit 1 of 6" });
    await sendWithCode(dialog);
    await waitFor(() => expect(keys).toHaveLength(3));
    expect(keys[2]).not.toBe(keys[0]);
  });

  it("explains that sub-merchant accounts are hidden only when some were left out", async () => {
    mswServer.use(http.get(`${base}/bank-options`, () => HttpResponse.json({ options: [bankOption], hasHiddenSubMerchantAccounts: true })));
    renderContainer();
    const dialog = await openCreateModal();
    expect(await within(dialog).findByText("Tài khoản cấp Sub-merchant chưa dùng được để rút tiền")).toBeInTheDocument();
  });
});

describe("withdrawal detail modal", () => {
  it("shows the progress and what the status means, and is read-only", async () => {
    mswServer.use(http.get(`${base}/${pending.id}`, () => HttpResponse.json(pending)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết yêu cầu rút tiền WD2601/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("list", { name: "Tiến trình yêu cầu" })).toBeInTheDocument();
    expect(within(dialog).getByText(/chờ người có thẩm quyền/)).toBeInTheDocument();
    expect(within(dialog).getByText(/xxxx1789/)).toBeInTheDocument();
    const names = within(dialog).getAllByRole("button").map((button) => button.getAttribute("aria-label") ?? button.textContent);
    expect(names.every((name) => /Đóng|Close|Sao chép/i.test(name ?? ""))).toBe(true);
  });

  it("tells the merchant a reconciliation needs nothing from them", async () => {
    const stuck = makeWithdrawal({ status: "RECONCILIATION_REQUIRED" });
    listReturns([stuck]);
    mswServer.use(http.get(`${base}/${stuck.id}`, () => HttpResponse.json(stuck)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết yêu cầu rút tiền WD2601/ }));
    expect(await screen.findByText(/không cần làm gì/)).toBeInTheDocument();
  });
});
