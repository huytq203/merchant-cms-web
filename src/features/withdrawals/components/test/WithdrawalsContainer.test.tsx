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
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const otherSubId = "55555555-5555-4555-8555-555555555555";
const twoSubs = [
  { id: subMerchantId, label: "SUB1 · Cửa hàng A" },
  { id: otherSubId, label: "SUB2 · Cửa hàng B" },
];
const filter: WithdrawalListFilter = { page: 1, pageSize: 10 };
const abilities = { canCreate: true };
const bankOption: WithdrawalBankOption = {
  id: "44444444-4444-4444-8444-444444444444",
  bankCode: "VCB",
  accountNumberMasked: "xxxx1789",
  accountName: "CONG TY A",
  isDefault: true,
  subMerchantId,
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
  setoffAmount: 0,
  netReceived: 4_994_500,
  payoutFeeMode: "DEDUCT",
  ...overrides,
});
const pending = makeWithdrawal();
const makeBalance = (overrides: Record<string, unknown> = {}) => ({
  subMerchantId, availableBalance: 128_450_000, heldBalance: 200_000, pendingSettlement: 300_000, readyAmount: 6_000_000,
  setoff: 1_000, fee: 5_500, netReceived: 5_993_500, zeroNet: false, dailyLimitRemaining: 500_000_000,
  dailyCountRemaining: null, minimumAmount: 10_000, maximumAmount: null, asOf: "2026-10-26T03:00:00Z", ...overrides,
});
const challenge = { otpSessionId: "session-1", maskedRecipient: "ow***@example.com", expiresInSeconds: 300, canResendAfterSeconds: 60 };
const codeError = (code: string, message: string, status = 409) => HttpResponse.json({ message, code }, { status });

function renderContainer(props: Partial<{ abilities: typeof abilities; subChoices: typeof twoSubs }> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WithdrawalsContainer filter={filter} abilities={props.abilities ?? abilities} subChoices={props.subChoices ?? twoSubs} />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Withdrawal[]) {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));
}

/** Records the Sub of every balance request and answers with the given figures. */
function balanceReturns(balance = makeBalance()) {
  const requests: (string | null)[] = [];
  mswServer.use(http.get(`${base}/balance`, ({ request }) => {
    requests.push(new URL(request.url).searchParams.get("subMerchantId"));
    return HttpResponse.json(balance);
  }));
  return requests;
}

/** Ghi lại subMerchantId của mỗi lần gọi bank-options và trả các tài khoản đã cho. */
function bankOptionsReturn(options: WithdrawalBankOption[] = [bankOption]) {
  const requests: (string | null)[] = [];
  mswServer.use(http.get(`${base}/bank-options`, ({ request }) => {
    requests.push(new URL(request.url).searchParams.get("subMerchantId"));
    return HttpResponse.json({ options });
  }));
  return requests;
}

beforeEach(() => {
  listReturns([pending]);
  bankOptionsReturn();
  mswServer.use(
    http.post(`${base}/otp-challenge`, () => HttpResponse.json(challenge)),
    http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([])),
  );
  balanceReturns();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function openCreateModal() {
  await userEvent.click(screen.getByRole("button", { name: /Tạo yêu cầu rút tiền/ }));
  return screen.findByRole("dialog");
}

async function pickSub(dialog: HTMLElement, name: RegExp = /SUB1/) {
  await userEvent.click(within(dialog).getByRole("combobox", { name: /Sub-merchant/ }));
  await userEvent.click(await screen.findByRole("option", { name }));
}

/** Chỉ cần chọn Sub: tài khoản duy nhất của Sub được tự chọn. */
async function pickAccount(dialog: HTMLElement) {
  await pickSub(dialog);
}

async function selectAccount(dialog: HTMLElement) {
  await pickAccount(dialog);
  await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
}

async function goToReview(dialog: HTMLElement) {
  await selectAccount(dialog);
  await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
  await within(dialog).findByText(/xxxx1789/);
}

async function goToCode(dialog: HTMLElement) {
  await goToReview(dialog);
  await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
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

  it("lists amount, escrow setoff, fee and net received; the fee is not added on top for a Sub request", async () => {
    listReturns([makeWithdrawal({ amount: 1_568_000, setoffAmount: 1_000_000, fee: 5_680, netReceived: 562_320 })]);
    renderContainer();
    const row = (await screen.findByText("WD2601")).closest("tr") as HTMLElement;
    const headers = screen.getAllByRole("columnheader").map((cell) => cell.textContent);
    expect(headers).toEqual(expect.arrayContaining(["Số tiền rút", "Cấn trừ ký quỹ", "Phí rút", "Thực nhận"]));
    expect(headers).not.toContain("Tổng trừ ví");
    expect(within(row).getByText("1.568.000 vnđ")).toBeInTheDocument();
    expect(within(row).getByText("1.000.000 vnđ")).toBeInTheDocument();
    expect(within(row).getByText("5.680 vnđ")).toBeInTheDocument();
    expect(within(row).getByText("562.320 vnđ")).toBeInTheDocument();
    expect(within(row).queryByText("1.573.680 vnđ")).not.toBeInTheDocument();
  });

  it("says the fee was charged on top for an old ADD_ON request", async () => {
    listReturns([makeWithdrawal({ payoutFeeMode: "ADD_ON", netReceived: 5_000_000 })]);
    renderContainer();
    const row = (await screen.findByText("WD2601")).closest("tr") as HTMLElement;
    expect(within(row).getByText("Tổng trừ ví 5.005.500 vnđ")).toBeInTheDocument();
  });

  it("labels the requests the system made as automatic withdrawals", async () => {
    listReturns([makeWithdrawal({ id: "55555555-5555-4555-8555-555555555555", transactionCode: "WD2602", requestType: "AUTO_SWEEP" }), pending]);
    renderContainer();
    const automatic = (await screen.findByText("WD2602")).closest("tr") as HTMLElement;
    expect(within(automatic).getByText("Rút tự động")).toBeInTheDocument();
    const manual = screen.getByText("WD2601").closest("tr") as HTMLElement;
    expect(within(manual).queryByText("Rút tự động")).not.toBeInTheDocument();
  });

  it("hides the create button without CREATE_WITHDRAWAL", async () => {
    renderContainer({ abilities: { canCreate: false } });
    await screen.findByText("WD2601");
    expect(screen.queryByRole("button", { name: /Tạo yêu cầu rút tiền/ })).not.toBeInTheDocument();
  });
});

describe("filters", () => {
  it("does not ask for a balance on the list: it belongs to one Sub", async () => {
    const requests = balanceReturns();
    renderContainer();
    await screen.findByText("WD2601");
    expect(requests).toEqual([]);
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

  it("offers four stages (no reconciliation) instead of the BE statuses", async () => {
    renderContainer();
    await screen.findByText("WD2601");
    await userEvent.click(within(screen.getByRole("form", { name: "Bộ lọc tìm kiếm" })).getByRole("combobox", { name: /Trạng thái/ }));
    expect(within(await screen.findByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });
});

describe("create withdrawal modal: account and balance", () => {
  it("asks for no balance until a Sub is chosen, then asks for the balance of that Sub", async () => {
    const requests = balanceReturns();
    renderContainer();
    const dialog = await openCreateModal();
    expect(await within(dialog).findByText("Chọn Sub-merchant để xem số tiền sẵn sàng rút.")).toBeInTheDocument();
    expect(requests).toEqual([]);
    await selectAccount(dialog);
    expect(requests).toEqual([subMerchantId]);
  });

  it("shows the ready amount, setoff, fee and net received, and has no amount to type", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await selectAccount(dialog);
    const panel = within(dialog).getByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(within(panel).getByText(/6\.000\.000/)).toBeInTheDocument();
    expect(within(panel).getByText(/5\.993\.500/)).toBeInTheDocument();
    expect(within(panel).getByText(/5\.500/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("textbox", { name: /Số tiền/ })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Rút tối đa" })).not.toBeInTheDocument();
  });

  it("shows the escrow shortfall before and after this request when the escrow is short", async () => {
    balanceReturns(makeBalance({ readyAmount: 1_568, setoff: 1_568, fee: 0, netReceived: 0, zeroNet: true,
      escrowShortfallBefore: 5_680, escrowShortfallAfter: 4_112 }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    const panel = await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(await within(panel).findByText("Ký quỹ còn thiếu trước khi rút")).toBeInTheDocument();
    expect(within(panel).getByText("Ký quỹ còn thiếu sau lệnh này")).toBeInTheDocument();
    expect(within(panel).getByText(/5\.680/)).toBeInTheDocument();
    expect(within(panel).getByText(/4\.112/)).toBeInTheDocument();
  });

  it("hides the escrow shortfall rows when nothing is missing", async () => {
    balanceReturns(makeBalance({ escrowShortfallBefore: 0, escrowShortfallAfter: 0 }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    await within(dialog).findByText(/5\.993\.500/);
    expect(within(dialog).queryByText("Ký quỹ còn thiếu trước khi rút")).not.toBeInTheDocument();
  });

  it("blocks the request when the remainder after the setoff cannot pay the fee", async () => {
    balanceReturns(makeBalance({ readyAmount: 10_000, setoff: 7_000, fee: 5_500, netReceived: 0, zeroNet: false,
      blocker: "FEE_EXCEEDS_REMAINDER", blockerMessage: "Số tiền còn lại sau cấn trừ ký quỹ không đủ trả phí rút" }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    expect(await within(dialog).findByText("Số tiền còn lại sau cấn trừ ký quỹ không đủ trả phí rút")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("blocks the request and says why when nothing is ready to withdraw", async () => {
    balanceReturns(makeBalance({ readyAmount: 0, netReceived: 0, fee: 0, setoff: 0 }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    expect(await within(dialog).findByText(/Chưa có khoản nào sẵn sàng/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("blocks a manual request for a Sub that withdraws automatically, and says why", async () => {
    balanceReturns(makeBalance({ automaticSettlement: true }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    expect(await within(dialog).findByText(/Điểm bán đang rút tự động theo chu kỳ/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("cannot go to the review step before an account is chosen", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("says the ledger could not be read, with a retry that asks again, instead of showing zero", async () => {
    let calls = 0;
    mswServer.use(http.get(`${base}/balance`, () => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json({ message: "Hệ thống đang gặp sự cố", code: "HTTP_503" }, { status: 502 })
        : HttpResponse.json(makeBalance());
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickAccount(dialog);
    expect(await within(dialog).findByText(/Chưa đọc được số dư từ sổ cái/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Thử lại" }));
    expect(await within(dialog).findByText(/6\.000\.000/)).toBeInTheDocument();
  });
});

describe("create withdrawal modal: Sub first", () => {
  const second: WithdrawalBankOption = {
    ...bankOption, id: "66666666-6666-4666-8666-666666666666", accountNumberMasked: "xxxx2222", isDefault: false, bankCode: "TCB",
  };

  it("lists the Subs the user may see and asks for accounts and balance of the chosen Sub only", async () => {
    const accountRequests = bankOptionsReturn();
    const balanceRequests = balanceReturns();
    renderContainer();
    const dialog = await openCreateModal();
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: /Tài khoản nhận/ })).not.toBeInTheDocument();
    expect(accountRequests).toEqual([]);
    await pickSub(dialog, /SUB2/);
    await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(accountRequests).toEqual([otherSubId]);
    expect(balanceRequests).toEqual([otherSubId]);
  });

  it("preselects the Sub when the user is assigned only one", async () => {
    const balanceRequests = balanceReturns();
    renderContainer({ subChoices: twoSubs.slice(0, 1) });
    const dialog = await openCreateModal();
    await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toHaveTextContent(/SUB1/);
    expect(balanceRequests).toEqual([subMerchantId]);
  });

  it("takes the only account of the Sub and shows it read-only, without a picker", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    expect(await within(dialog).findByText(/xxxx1789/)).toBeInTheDocument();
    expect(within(dialog).getByText(/CONG TY A/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("combobox", { name: /Tài khoản nhận/ })).not.toBeInTheDocument();
    await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeEnabled();
  });

  it("lists only the accounts of the Sub when there are two and preselects the default one", async () => {
    bankOptionsReturn([second, bankOption]);
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    const picker = await within(dialog).findByRole("combobox", { name: /Tài khoản nhận/ });
    expect(picker).toHaveTextContent(/Vietcombank/);
    await userEvent.click(picker);
    expect(await screen.findByRole("option", { name: /xxxx2222/ })).toBeInTheDocument();
  });

  it("says the Sub has no linked receiving account and blocks Tiếp tục", async () => {
    bankOptionsReturn([]);
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    expect(await within(dialog).findByText("Sub-merchant chưa có tài khoản nhận tiền đã liên kết")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("drops the account and balance of the old Sub when another Sub is chosen", async () => {
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    bankOptionsReturn([]);
    await pickSub(dialog, /SUB2/);
    expect(await within(dialog).findByText("Sub-merchant chưa có tài khoản nhận tiền đã liên kết")).toBeInTheDocument();
    expect(within(dialog).queryByText(/xxxx1789/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });
});

describe("create withdrawal modal: fee of the chosen account (11/11)", () => {
  const second: WithdrawalBankOption = {
    ...bankOption, id: "66666666-6666-4666-8666-666666666666", accountNumberMasked: "xxxx2222", isDefault: false, bankCode: "VPB",
  };

  /** Ghi lại bankAccountId của mỗi lần hỏi số dư; phí theo TK để thấy màn hình đổi số khi đổi TK. */
  function balanceByAccount() {
    const accounts: (string | null)[] = [];
    mswServer.use(http.get(`${base}/balance`, ({ request }) => {
      const account = new URL(request.url).searchParams.get("bankAccountId");
      accounts.push(account);
      return HttpResponse.json(account === second.id ? makeBalance({ fee: 7_700, netReceived: 5_991_300 }) : makeBalance());
    }));
    return accounts;
  }

  it("sends the id of the chosen account, once the accounts are known, and prices again when the account changes", async () => {
    bankOptionsReturn([second, bankOption]);
    const accounts = balanceByAccount();
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    const panel = await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(await within(panel).findByText(/5\.993\.500/)).toBeInTheDocument();
    // Không hỏi một lần "chưa có TK" rồi lại hỏi theo TK mặc định: chỉ hỏi khi đã biết danh sách TK.
    expect(accounts).toEqual([bankOption.id]);
    await userEvent.click(within(dialog).getByRole("combobox", { name: /Tài khoản nhận/ }));
    await userEvent.click(await screen.findByRole("option", { name: /xxxx2222/ }));
    expect(await within(dialog).findByText(/5\.991\.300/)).toBeInTheDocument();
    expect(accounts).toEqual([bankOption.id, second.id]);
  });

  it("without a chosen account and no default, shows the balances and asks to choose an account for the fee", async () => {
    bankOptionsReturn([{ ...bankOption, isDefault: false }, second]);
    const accounts: (string | null)[] = [];
    mswServer.use(http.get(`${base}/balance`, ({ request }) => {
      accounts.push(new URL(request.url).searchParams.get("bankAccountId"));
      return HttpResponse.json(makeBalance({ fee: null, netReceived: null, blocker: "BANK_ACCOUNT_REQUIRED",
        blockerMessage: "Chọn tài khoản nhận tiền để xem phí rút và số tiền thực nhận" }));
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    const panel = await within(dialog).findByRole("region", { name: "Số tiền sẵn sàng rút" });
    expect(accounts).toEqual([null]);
    expect(within(panel).getByText(/6\.000\.000/)).toBeInTheDocument();
    expect(within(panel).getByText(/128\.450\.000/)).toBeInTheDocument();
    expect(within(panel).getAllByText("Chờ chọn tài khoản")).toHaveLength(2);
    expect(within(panel).getByText("Chọn tài khoản nhận tiền để xem phí rút và số tiền thực nhận")).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: /Tài khoản nhận/ })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
  });

  it("an older BE answering 409 5736 does not kill the panel: it asks to choose an account, without a retry", async () => {
    bankOptionsReturn([{ ...bankOption, isDefault: false }, second]);
    mswServer.use(http.get(`${base}/balance`, () => codeError("5736",
      "Sub-merchant chưa được gán tài khoản ngân hàng nhận doanh thu nên chưa tạo được lệnh rút; hãy gán tài khoản tại Danh sách tài khoản ngân hàng")));
    renderContainer();
    const dialog = await openCreateModal();
    await pickSub(dialog);
    expect(await within(dialog).findByText("Chọn tài khoản nhận tiền để xem số tiền rút, phí rút và số tiền thực nhận")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: /Tài khoản nhận/ })).toBeInTheDocument();
  });
});

describe("create withdrawal modal: code and send", () => {
  it("asks for the code for the account and the ready amount, and asks again with the same pair on resend", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(`${base}/otp-challenge`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ ...challenge, canResendAfterSeconds: 0 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await userEvent.click(await within(dialog).findByRole("button", { name: "Gửi lại mã" }));
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies).toEqual([
      { bankAccountId: bankOption.id, amount: 6_000_000 },
      { bankAccountId: bankOption.id, amount: 6_000_000 },
    ]);
  });

  it("goes review, email code, then posts the ready amount and the code once and shows the result", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json(makeWithdrawal({ amount: 6_000_000, fee: 5_500 }), { status: 201 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToReview(dialog);
    expect(within(dialog).queryByRole("checkbox")).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    expect(await within(dialog).findByText(/ow\*\*\*@example\.com/)).toBeInTheDocument();
    await typeCode();
    await userEvent.dblClick(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    expect(await screen.findByRole("heading", { name: "Đã gửi yêu cầu rút tiền" })).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(Object.keys(bodies[0] as object).sort()).toEqual(["amount", "bankAccountId", "idempotencyKey", "otp"]);
    expect(bodies[0]).toMatchObject({
      bankAccountId: bankOption.id, amount: 6_000_000, otp: { otpSessionId: "session-1", otp: "123456" },
    });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("shows a wrong code (5732) on the code step and keeps the account", async () => {
    mswServer.use(http.post(base, () => codeError("MERCHANT_SENSITIVE_OTP_INVALID", "Mã OTP không đúng hoặc đã hết hạn", 400)));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Mã OTP không đúng hoặc đã hết hạn");
    expect(within(dialog).getByRole("textbox", { name: "Digit 1 of 6" })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Quay lại" }));
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toHaveTextContent(/SUB1/);
  });

  it("keeps the code step when BE says the code is missing (5731)", async () => {
    mswServer.use(http.post(base, () => codeError("5731", "Cần nhập mã OTP để rút tiền", 400)));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Cần nhập mã OTP để rút tiền");
    expect(within(dialog).getByRole("textbox", { name: "Digit 1 of 6" })).toBeInTheDocument();
  });

  it("retries a failed send with the same key", async () => {
    const keys: string[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      keys.push(((await request.json()) as { idempotencyKey: string }).idempotencyKey);
      return HttpResponse.json({ message: "Số dư không đủ" }, { status: 400 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    await within(dialog).findByRole("alert");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
  });

  it("goes back to the account step with the new total when the statement changed (5781), then sends the new amount with a new key", async () => {
    const posted: { amount: number; idempotencyKey: string }[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      posted.push((await request.json()) as { amount: number; idempotencyKey: string });
      return codeError("MERCHANT_WITHDRAWAL_STATEMENT_CHANGED", "Tổng tiền rút đã đổi thành 7.000.000");
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    const requests = balanceReturns(makeBalance({ readyAmount: 7_000_000, netReceived: 6_993_500 }));
    await sendWithCode(dialog);
    expect(await within(dialog).findByText("Tổng tiền rút đã đổi thành 7.000.000")).toBeInTheDocument();
    await waitFor(() => expect(requests).toEqual([subMerchantId]));
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await userEvent.click(await within(dialog).findByRole("button", { name: "Tiếp tục" }));
    await within(dialog).findByRole("textbox", { name: "Digit 1 of 6" });
    await sendWithCode(dialog);
    await waitFor(() => expect(posted).toHaveLength(2));
    expect(posted[0]?.amount).toBe(6_000_000);
    expect(posted[1]?.amount).toBe(7_000_000);
    expect(posted[1]?.idempotencyKey).not.toBe(posted[0]?.idempotencyKey);
  });

  it("returns to the account step and reads the Sub again when BE says it withdraws automatically (5782)", async () => {
    const message = "Sub-merchant đang ở chế độ quyết toán tự động; hệ thống tự tạo lệnh rút theo chu kỳ";
    mswServer.use(http.post(base, () => codeError("5782", message)));
    const requests = balanceReturns();
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    const before = requests.length;
    await sendWithCode(dialog);
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toBeInTheDocument();
    await waitFor(() => expect(requests.length).toBeGreaterThan(before));
  });

  it("keeps the code step and shows the BE message while a freeze is pending (5798)", async () => {
    const message = "Sub-merchant đang có lệnh đóng băng chờ xử lý; vui lòng thử lại sau ít phút";
    mswServer.use(http.post(base, () => codeError("5798", message)));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    expect(await within(dialog).findByText(message)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Gửi yêu cầu" })).toBeInTheDocument();
  });

  it("returns to the account step when nothing is ready any more (5780)", async () => {
    mswServer.use(http.post(base, () => codeError("5780", "Không có khoản nào sẵn sàng để rút")));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    expect(await within(dialog).findByText("Không có khoản nào sẵn sàng để rút")).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: /Sub-merchant/ })).toBeInTheDocument();
  });
});

describe("create withdrawal modal: zero net payout", () => {
  it("warns, needs the checkbox before a code is requested, and sends confirmZeroNet", async () => {
    balanceReturns(makeBalance({ netReceived: 0, setoff: 5_994_500, zeroNet: true }));
    const challenged = vi.fn();
    const bodies: unknown[] = [];
    mswServer.use(
      http.post(`${base}/otp-challenge`, () => {
        challenged();
        return HttpResponse.json(challenge);
      }),
      http.post(base, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(makeWithdrawal(), { status: 201 });
      }),
    );
    renderContainer();
    const dialog = await openCreateModal();
    await goToReview(dialog);
    expect(within(dialog).getByText(/Số tiền thực nhận bằng 0/)).toBeInTheDocument();
    const next = within(dialog).getByRole("button", { name: "Tiếp tục" });
    expect(next).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Tôi hiểu/ }));
    expect(next).toBeEnabled();
    await userEvent.click(next);
    await within(dialog).findByRole("textbox", { name: "Digit 1 of 6" });
    await sendWithCode(dialog);
    await screen.findByRole("heading", { name: "Đã gửi yêu cầu rút tiền" });
    expect(challenged).toHaveBeenCalledTimes(1);
    expect(bodies[0]).toMatchObject({ confirmZeroNet: true, amount: 6_000_000 });
  });

  it("explains that the whole amount goes to the escrow and what is still missing", async () => {
    balanceReturns(makeBalance({ readyAmount: 1_568, setoff: 1_568, fee: 0, netReceived: 0, zeroNet: true,
      escrowShortfallBefore: 5_680, escrowShortfallAfter: 4_112, minimumAmount: null }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToReview(dialog);
    expect(within(dialog).getByText(
      "Toàn bộ 1.568 vnđ dùng để bù ký quỹ. Không có tiền chuyển về tài khoản. Ký quỹ còn thiếu 4.112 vnđ sẽ được cấn ở lần rút sau.",
    )).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
    expect(within(dialog).getByRole("checkbox", { name: /Tôi hiểu/ })).toBeInTheDocument();
  });

  it("does not send confirmZeroNet when the net is not zero", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(makeWithdrawal(), { status: 201 });
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    await screen.findByRole("heading", { name: "Đã gửi yêu cầu rút tiền" });
    expect(bodies[0]).not.toHaveProperty("confirmZeroNet");
  });

  it("asks again on the review step when BE answers 5760, then sends confirmZeroNet", async () => {
    const bodies: Record<string, unknown>[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      bodies.push(body);
      return body.confirmZeroNet
        ? HttpResponse.json(makeWithdrawal(), { status: 201 })
        : codeError("MERCHANT_WITHDRAWAL_ZERO_NET_CONFIRMATION", "Thực nhận bằng 0, cần xác nhận");
    }));
    renderContainer();
    const dialog = await openCreateModal();
    await goToCode(dialog);
    await sendWithCode(dialog);
    expect(await within(dialog).findByText(/Số tiền thực nhận bằng 0/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Tiếp tục" })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: /Tôi hiểu/ }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Tiếp tục" }));
    await within(dialog).findByRole("textbox", { name: "Digit 1 of 6" });
    await sendWithCode(dialog);
    await screen.findByRole("heading", { name: "Đã gửi yêu cầu rút tiền" });
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).not.toHaveProperty("confirmZeroNet");
    expect(bodies[1]).toMatchObject({ confirmZeroNet: true });
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

  it("shows the retired RECONCILIATION_REQUIRED as processing (alias chuyển tiếp)", async () => {
    const stuck = makeWithdrawal({ status: "RECONCILIATION_REQUIRED" });
    listReturns([stuck]);
    mswServer.use(http.get(`${base}/${stuck.id}`, () => HttpResponse.json(stuck)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết yêu cầu rút tiền WD2601/ }));
    expect(await screen.findByText(/Hệ thống đang gửi lệnh chuyển sang ngân hàng/)).toBeInTheDocument();
    expect(screen.queryByText("Cần đối soát")).not.toBeInTheDocument();
  });
});
