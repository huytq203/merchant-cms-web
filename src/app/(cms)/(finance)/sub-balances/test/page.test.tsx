// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
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
  render(await SubBalancesPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement);
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
});
