// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { reportFixture } from "@/features/sub-balances/test/fixtures";

const { getServerSession, redirect } = vi.hoisted(() => ({ getServerSession: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/sub-balances",
  useSearchParams: () => new URLSearchParams(),
}));
import SubBalancesPage from "../page";

const firstSub = "11111111-1111-4111-8111-111111111111";
const secondSub = "22222222-2222-4222-8222-222222222222";
// Mọi phiên (kể cả người quản lý Sub) đọc tên Sub từ /choices nhẹ, không đọc danh sách đầy đủ.
const subsUrl = "https://merchant.test/api/v1/merchant/sub-merchants/choices";
const balanceUrl = "https://merchant.test/api/v1/merchant/sub-balances/:id";
const subRow = (id: string, code: string, name: string) => ({ id, code, name, status: "ACTIVE", isDefault: false });
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_BALANCE", "MANAGE_SUB_MERCHANT", "CREATE_WITHDRAWAL"] };

let requestedBalanceIds: string[] = [];

function listSubs(rows = [subRow(firstSub, "SUB001", "Cửa hàng A"), subRow(secondSub, "SUB002", "Cửa hàng B")]) {
  mswServer.use(http.get(subsUrl, () => HttpResponse.json({ success: true, data: rows })));
}

async function renderPage(searchParams: Record<string, string> = {}) {
  // The movements popup reads through react-query, so the server-rendered page needs a client around it as in the app.
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {await SubBalancesPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement}
  </QueryClientProvider>);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  requestedBalanceIds = [];
  listSubs();
  mswServer.use(http.get(balanceUrl, ({ params }) => {
    requestedBalanceIds.push(String(params.id));
    return HttpResponse.json({ success: true, data: { ...reportFixture, subMerchantId: String(params.id) } });
  }));
});
afterEach(cleanup);

describe("sub balances page", () => {
  it("denies access without VIEW_BALANCE and does not call the BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["MANAGE_SUB_MERCHANT"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
    expect(requestedBalanceIds).toEqual([]);
  });

  it("shows the available balance of the first Sub by default", async () => {
    await renderPage();
    expect(requestedBalanceIds).toEqual([firstSub]);
    expect(screen.getByRole("region", { name: "Số dư khả dụng" })).toHaveTextContent("5.000.000");
    expect(screen.getByRole("link", { name: "Tạo lệnh rút" })).toHaveAttribute("href", "/withdrawal");
  });

  it("reads the Sub chosen in the URL", async () => {
    await renderPage({ subMerchantId: secondSub });
    expect(requestedBalanceIds).toEqual([secondSub]);
  });

  it("ignores a Sub outside the session choices", async () => {
    await renderPage({ subMerchantId: "33333333-3333-4333-8333-333333333333" });
    expect(requestedBalanceIds).toEqual([firstSub]);
  });

  it("hides the withdrawal shortcut without CREATE_WITHDRAWAL", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_BALANCE", "MANAGE_SUB_MERCHANT"] });
    await renderPage();
    expect(screen.queryByRole("link", { name: "Tạo lệnh rút" })).not.toBeInTheDocument();
  });

  it("shows an error with retry instead of zero amounts when the ledger cannot be read", async () => {
    mswServer.use(http.get(balanceUrl, () => HttpResponse.json(
      { success: false, status: "5753", message: "MERCHANT_ESCROW_BALANCE_UNAVAILABLE", detail: "Chưa đọc được số dư" },
      { status: 503 },
    )));
    await renderPage();
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa đọc được số dư từ sổ cái");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Số dư khả dụng" })).not.toBeInTheDocument();
  });

  it("explains an empty page when the session has no Sub", async () => {
    listSubs([]);
    await renderPage();
    expect(screen.getByText("Chưa có Sub-merchant nào để xem số dư.")).toBeInTheDocument();
    expect(requestedBalanceIds).toEqual([]);
  });

  // GĐ6 Task 6.11: các dòng tách ngăn chỉ vẽ khi BE gửi số theo ngăn.
  it("subBalancePageShowsPocketLinesWhenPresent", async () => {
    const line = (code: string, label: string, amount: number, explanation: string) => ({ code, label, amount, explanation });
    mswServer.use(http.get(balanceUrl, ({ params }) => HttpResponse.json({ success: true, data: {
      ...reportFixture, subMerchantId: String(params.id),
      walletAvailable: 3_000_000, otherAvailable: 2_000_000, disbursementReserved: 150_000, overdraft: 2_300_000, otherDisplayBalance: -300_000,
      availableWallet: line("AVAILABLE_WALLET", "Số dư thu hộ ví", 3_000_000, "Rút bằng Yêu cầu chi tiền."),
      availableOther: line("AVAILABLE_OTHER", "Số dư thu-chi hộ khác", 2_000_000, "Dùng cho chi hộ và Lệnh rút."),
      disbursementHold: line("DISBURSEMENT_RESERVED", "Đang giữ cho chi hộ", 150_000, "Đã tính vào tổng đóng băng."),
      overdraftDebt: line("OVERDRAFT", "Dư nợ Trả sau", 2_300_000, "Cần nạp bù."),
    } })));
    await renderPage();
    const pockets = screen.getByRole("region", { name: "Số dư theo nguồn tiền" });
    expect(pockets).toHaveTextContent("Số dư thu hộ ví");
    expect(pockets).toHaveTextContent("3.000.000");
    expect(pockets).toHaveTextContent("Số dư thu-chi hộ khác");
    expect(pockets).toHaveTextContent("2.000.000");
    expect(pockets).toHaveTextContent("Đang giữ cho chi hộ");
    expect(pockets).toHaveTextContent("150.000");
    expect(pockets).toHaveTextContent("Dư nợ Trả sau");
    expect(pockets).toHaveTextContent("2.300.000");
    // Số hiển thị của ngăn khác = khả dụng trừ dư nợ, có thể âm.
    expect(pockets).toHaveTextContent("-300.000");
    // Tổng khả dụng cũ vẫn ở thẻ đầu trang.
    expect(screen.getByRole("region", { name: "Số dư khả dụng" })).toHaveTextContent("5.000.000");
  });

  it("subBalancePageHidesPocketLinesWhenAbsent", async () => {
    await renderPage();
    expect(screen.queryByRole("region", { name: "Số dư theo nguồn tiền" })).not.toBeInTheDocument();
    expect(screen.queryByText("Dư nợ Trả sau")).not.toBeInTheDocument();
    expect(screen.queryByText("Số dư thu hộ ví")).not.toBeInTheDocument();
  });

  // GĐ7 Task 7.13: dòng ngăn mở popup biến động đúng ngăn (CẦN CHỐT 13).
  describe("movements of a pocket (GĐ7)", () => {
    const line = (code: string, label: string, amount: number) => ({ code, label, amount, explanation: "x" });
    const withPockets = () => mswServer.use(http.get(balanceUrl, ({ params }) => HttpResponse.json({ success: true, data: {
      ...reportFixture, subMerchantId: String(params.id),
      walletAvailable: 3_000_000, otherAvailable: 2_000_000, disbursementReserved: 0, overdraft: 2_300_000, otherDisplayBalance: -300_000,
      availableWallet: line("AVAILABLE_WALLET", "Số dư thu hộ ví", 3_000_000),
      availableOther: line("AVAILABLE_OTHER", "Số dư thu-chi hộ khác", 2_000_000),
    } })));
    const movementQueries: URLSearchParams[] = [];
    beforeEach(() => {
      movementQueries.length = 0;
      withPockets();
      mswServer.use(http.get("/api/v1/admin/sub-balances/:id/movements", ({ request }) => {
        movementQueries.push(new URL(request.url).searchParams);
        return HttpResponse.json({ rows: [], total: 0, summary: null });
      }));
    });

    it("subBalanceViewOpensOtherPocketMovements: Xem biến động on the thu-chi hộ khác row opens the OTHER pocket", async () => {
      await renderPage();
      const user = userEvent.setup();
      const pockets = screen.getByRole("region", { name: "Số dư theo nguồn tiền" });
      await user.click(within(pockets).getByRole("button", { name: "Xem biến động thu-chi hộ khác" }));
      expect(await screen.findByRole("heading", { name: "Biến động số dư thu-chi hộ khác" })).toBeInTheDocument();
      await waitFor(() => expect(movementQueries[0]?.get("pocket")).toBe("OTHER"));
      // The popup's subtitle carries the displayed balance of that pocket: net of the Trả sau debt, so negative here.
      expect(screen.getByText(/Số dư thu-chi hộ khác hiện tại −300\.000 vnđ/)).toBeInTheDocument();
    });

    it("the wallet row opens the WALLET pocket, the header button keeps opening every pocket", async () => {
      await renderPage();
      const user = userEvent.setup();
      await user.click(within(screen.getByRole("region", { name: "Số dư theo nguồn tiền" })).getByRole("button", { name: "Xem biến động thu hộ ví" }));
      await waitFor(() => expect(movementQueries[0]?.get("pocket")).toBe("WALLET"));
    });

    it("the Xuất CSV button follows EXPORT_BALANCE", async () => {
      await renderPage();
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Xem biến động số dư" }));
      await screen.findByRole("heading", { name: "Biến động số dư khả dụng" });
      expect(screen.queryByRole("button", { name: "Xuất CSV" })).not.toBeInTheDocument();
      cleanup();
      getServerSession.mockResolvedValue({ ...session, permissions: [...session.permissions, "EXPORT_BALANCE"] });
      await renderPage();
      await user.click(screen.getByRole("button", { name: "Xem biến động số dư" }));
      expect(await screen.findByRole("button", { name: "Xuất CSV" })).toBeInTheDocument();
    });
  });
});
