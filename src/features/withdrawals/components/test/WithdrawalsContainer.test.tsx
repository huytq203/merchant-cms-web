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
  mswServer.use(http.get(`${base}/bank-options`, () => HttpResponse.json({ options: [bankOption], hasHiddenSubMerchantAccounts: false })));
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
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
  await userEvent.click(within(dialog).getAllByRole("combobox")[1]!);
  await userEvent.click(await screen.findByRole("option", { name: /Vietcombank/ }));
  const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
  await userEvent.clear(amount);
  await userEvent.type(amount, amountText);
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

  it("renders no filter card and requests only the page, since the BE cannot filter", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(base, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json({ rows: [pending], total: 1 });
    }));
    renderContainer();
    await screen.findByText("WD2601");
    expect(screen.queryByRole("region", { name: "Bộ lọc tìm kiếm" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tìm kiếm" })).not.toBeInTheDocument();
    expect(Object.fromEntries(query!)).toEqual({ page: "1", pageSize: "10" });
  });

  it("hides the create button without CREATE_WITHDRAWAL", async () => {
    renderContainer({ abilities: { canCreate: false } });
    await screen.findByText("WD2601");
    expect(screen.queryByRole("button", { name: /Tạo yêu cầu rút tiền/ })).not.toBeInTheDocument();
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
    expect(within(dialog).queryByRole("button", { name: "Gửi yêu cầu" })).not.toBeInTheDocument();
    expect(posted).not.toHaveBeenCalled();
  });

  it("requires a bank account before the review step", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tiền/ }), "1000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText("Chọn tài khoản ngân hàng nhận tiền")).toBeInTheDocument();
  });

  it("reviews the masked account, posts the body once even when clicked twice, then closes", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json(makeWithdrawal({ amount: 250000 }), { status: 201 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await fillStepOne(dialog);
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/xxxx1789/)).toBeInTheDocument();
    await userEvent.dblClick(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(bodies).toHaveLength(1);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(["amount", "bankAccountId", "idempotencyKey"]);
    expect(bodies[0]).toMatchObject({ bankAccountId: bankOption.id, amount: 250000 });
    expect((bodies[0] as { idempotencyKey: string }).idempotencyKey.length).toBeLessThanOrEqual(100);
  });

  it("explains that sub-merchant accounts are hidden only when some were left out", async () => {
    mswServer.use(http.get(`${base}/bank-options`, () => HttpResponse.json({ options: [bankOption], hasHiddenSubMerchantAccounts: true })));
    renderContainer();
    const dialog = await openCreateModal();
    expect(await within(dialog).findByText("Tài khoản cấp điểm bán chưa dùng được để rút tiền")).toBeInTheDocument();
  });

  it("shows no sub-merchant account note when nothing was hidden", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await within(dialog).findByRole("textbox", { name: /Số tiền/ });
    expect(within(dialog).queryByText("Tài khoản cấp điểm bán chưa dùng được để rút tiền")).not.toBeInTheDocument();
  });

  it("shows the BE error for an amount above the balance, keeps the data and retries with the same key", async () => {
    const keys: string[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      const body = (await request.json()) as { idempotencyKey: string };
      keys.push(body.idempotencyKey);
      return HttpResponse.json({ message: "Số dư không đủ" }, { status: 400 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await fillStepOne(dialog, "999000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Gửi yêu cầu" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Số dư không đủ");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    expect(within(dialog).getByRole("textbox", { name: /Số tiền/ })).toHaveValue("999000000");
  });

  it("sends a new key when the amount changed after a failure", async () => {
    const keys: string[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      keys.push(((await request.json()) as { idempotencyKey: string }).idempotencyKey);
      return HttpResponse.json({ message: "Số dư không đủ" }, { status: 400 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await fillStepOne(dialog, "999000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Gửi yêu cầu" }));
    await within(dialog).findByRole("alert");
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
    await userEvent.clear(amount);
    await userEvent.type(amount, "1000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).not.toBe(keys[0]);
  });
});

describe("withdrawal detail modal", () => {
  it("is read-only and shows the awaiting-approval state with the masked account", async () => {
    mswServer.use(http.get(`${base}/${pending.id}`, () => HttpResponse.json(pending)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết yêu cầu rút tiền WD2601/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Chờ duyệt")).toBeInTheDocument();
    expect(within(dialog).getByText(/xxxx1789/)).toBeInTheDocument();
    const names = within(dialog).getAllByRole("button").map((button) => button.getAttribute("aria-label") ?? button.textContent);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /Đóng|Close/i.test(name ?? ""))).toBe(true);
  });
});
