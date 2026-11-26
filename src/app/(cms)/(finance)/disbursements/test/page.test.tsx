// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { overviewFixture, SUB_ID } from "@/features/disbursements/test/fixtures";

const { getServerSession, redirect } = vi.hoisted(() => ({ getServerSession: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/disbursements",
  useSearchParams: () => new URLSearchParams(),
}));
import DisbursementsPage from "../page";
import TopupsPage from "../topups/page";

const base = "https://merchant.test/api/v1";
const subRow = (id: string, code: string, name: string) => ({ id, code, name, status: "ACTIVE", isDefault: false });
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_DISBURSEMENT", "CREATE_DISBURSEMENT"] };

const envelope = (data: unknown) => HttpResponse.json({ success: true, data });
const overviewUrl = `${base}/merchant/disbursements/subs/:id/overview`;

function mockOverview(data: unknown = overviewFixture) {
  mswServer.use(http.get(overviewUrl, () => envelope(data)));
}

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await DisbursementsPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  mswServer.use(http.get(`${base}/merchant/sub-merchants/choices`, () => envelope([subRow(SUB_ID, "SUB001", "Cửa hàng A")])));
  mockOverview();
});
afterEach(cleanup);

describe("disbursements overview page", () => {
  it("denies access without VIEW_DISBURSEMENT", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_DISBURSEMENT"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });

  it("shows the balance and the create button for a user with CREATE_DISBURSEMENT", async () => {
    await renderPage();
    expect(screen.getByRole("region", { name: "Số dư thu-chi hộ" })).toHaveTextContent("5.000.000");
    expect(screen.getByRole("link", { name: "Tạo lệnh chi hộ" })).toHaveAttribute("href", `/disbursements/new?subMerchantId=${SUB_ID}`);
    expect(screen.getByRole("link", { name: "Nạp tiền" })).toHaveAttribute("href", `/disbursements/topups?subMerchantId=${SUB_ID}`);
  });

  it("links to the order history and the batch list of the Sub on screen, for a viewer too", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    await renderPage();
    expect(screen.getByRole("link", { name: "Lịch sử chi hộ" })).toHaveAttribute("href", `/disbursements/orders?subMerchantIds=${SUB_ID}`);
    expect(screen.getByRole("link", { name: "Lô chi hộ" })).toHaveAttribute("href", `/disbursements/batches?subId=${SUB_ID}`);
  });

  it("createButtonHiddenWithoutCreateDisbursement", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    await renderPage();
    expect(screen.queryByRole("link", { name: "Tạo lệnh chi hộ" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Số dư thu-chi hộ" })).toBeInTheDocument();
  });

  it("hides the create button when neither single nor batch is enabled for the Sub", async () => {
    mockOverview({ ...overviewFixture, service: { ...overviewFixture.service, channels: ["API"] } });
    await renderPage();
    expect(screen.queryByRole("link", { name: "Tạo lệnh chi hộ" })).not.toBeInTheDocument();
    expect(screen.getByText(/chưa bật chi hộ đơn lẻ hoặc theo lô/i)).toBeInTheDocument();
  });

  it("shows a negative display balance of a post-funded Sub", async () => {
    mockOverview({
      ...overviewFixture,
      fundingMode: "POSTFUNDED",
      creditLimit: 20_000_000,
      balance: { available: 0, overdraft: 5_000_000, disbursementReserved: 0, creditLimitRemaining: 15_000_000, displayBalance: -5_000_000 },
    });
    await renderPage();
    expect(screen.getByRole("region", { name: "Số dư thu-chi hộ" })).toHaveTextContent("-5.000.000");
  });

  it("explains a Sub whose Chi hộ service is off instead of showing zeros", async () => {
    mockOverview({ ...overviewFixture, service: { ...overviewFixture.service, disbursementEnabled: false, channels: [] }, balance: null });
    await renderPage();
    expect(screen.getByText("Sub-merchant này chưa bật dịch vụ Chi hộ.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tạo lệnh chi hộ" })).not.toBeInTheDocument();
  });

  it("shows an error with retry when the overview cannot be read", async () => {
    mswServer.use(http.get(overviewUrl, () => HttpResponse.json({ success: false, status: "6322", message: "X", detail: "x" }, { status: 503 })));
    await renderPage();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("disbursement top-ups page", () => {
  const topupsUrl = `${base}/merchant/disbursements/subs/:id/topups`;
  const accountsUrl = `${base}/merchant/disbursements/receiving-accounts`;
  const pageOf = (content: unknown[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 10 });

  async function renderTopups() {
    render(await TopupsPage({ searchParams: Promise.resolve({}) }) as ReactElement);
  }

  it("emptyReceivingAccountsShowsNotConfigured", async () => {
    mswServer.use(http.get(accountsUrl, () => envelope([])), http.get(topupsUrl, () => envelope(pageOf([]))));
    await renderTopups();
    expect(screen.getByText("Chưa cấu hình tài khoản nhận tiền")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sao chép/i })).not.toBeInTheDocument();
  });

  it("shows the receiving account with copy buttons and the top-up status in Vietnamese", async () => {
    mswServer.use(
      http.get(accountsUrl, () => envelope([{ bankCode: "VCB", bankName: "Vietcombank", accountNumber: "0011223344", accountName: "CONG TY BEAM", subCode: "SUB001" }])),
      http.get(topupsUrl, () => envelope(pageOf([{
        orderCode: "NT001", purpose: "CHI_HO", amount: 2_000_000, transferReference: "FT123", creditedOn: "2026-11-19",
        status: "Hoàn thành", statusCode: "APPROVED", accountingStatus: "POSTED", decidedAt: "2026-11-19T05:00:00Z", decisionReason: null,
      }]))),
    );
    await renderTopups();
    expect(screen.getByText("0011223344")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /sao chép/i }).length).toBeGreaterThan(0);
    expect(screen.getByText("NT001")).toBeInTheDocument();
    // Nhãn "Hoàn thành" còn nằm ở bộ lọc nên chỉ xét trong bảng; hạch toán ở cột riêng.
    expect(within(screen.getByRole("table")).getByText("Hoàn thành")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("Đã hạch toán")).toBeInTheDocument();
  });

  it("asks BE for the accounts of the chosen purpose and refund", async () => {
    const REFUND = "33333333-3333-4333-8333-333333333333";
    const seen: URL[] = [];
    mswServer.use(
      http.get(accountsUrl, ({ request }) => { seen.push(new URL(request.url)); return envelope([]); }),
      http.get(topupsUrl, () => envelope(pageOf([]))),
    );
    render(await TopupsPage({ searchParams: Promise.resolve({ purpose: "HOAN", refundId: REFUND }) }) as ReactElement);
    expect(seen).toHaveLength(1);
    expect(seen[0]?.searchParams.get("purpose")).toBe("HOAN");
    expect(seen[0]?.searchParams.get("refundId")).toBe(REFUND);
  });

  it("Hoàn without a refund shows the accounts in two groups by source of the original order", async () => {
    const seen: URL[] = [];
    mswServer.use(
      http.get(accountsUrl, ({ request }) => {
        seen.push(new URL(request.url));
        return envelope([
          { bankCode: "VCB", bankName: "Vietcombank", accountNumber: "0011000654321", accountName: "BEAM VI", subCode: "SUB001", accountType: "WALLET_ESCROW" },
          { bankCode: "VCB", bankName: "Vietcombank", accountNumber: "0011000123456", accountName: "BEAM THU CHI HO", subCode: "SUB001", accountType: "COLLECTION_DISBURSEMENT" },
        ]);
      }),
      http.get(topupsUrl, () => envelope(pageOf([]))),
    );
    render(await TopupsPage({ searchParams: Promise.resolve({ purpose: "HOAN" }) }) as ReactElement);
    expect(seen[0]?.searchParams.get("purpose")).toBe("HOAN");
    expect(seen[0]?.searchParams.has("refundId")).toBe(false);
    const wallet = screen.getByRole("heading", { name: "Đơn thanh toán bằng ví FlexPay" }).closest("section") as HTMLElement;
    const other = screen.getByRole("heading", { name: "Đơn thanh toán bằng nguồn khác" }).closest("section") as HTMLElement;
    expect(within(wallet).getByText("0011000654321")).toBeInTheDocument();
    expect(within(wallet).queryByText("0011000123456")).not.toBeInTheDocument();
    expect(within(other).getByText("0011000123456")).toBeInTheDocument();
    expect(within(other).getByText("SUB001")).toBeInTheDocument();
  });

  it("denies access without VIEW_DISBURSEMENT", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: [] });
    await renderTopups();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });
});
