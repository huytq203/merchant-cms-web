// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { contributionsFixture, ledgerPage, masterId, standingFixture } from "@/features/escrow/test/fixtures";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/escrow",
  useSearchParams: () => new URLSearchParams(),
}));
import EscrowPage from "../page";

const be = `https://merchant.test/api/v1/merchant/escrow/${masterId}`;
const session = { merchantIds: [masterId], merchants: [{ id: masterId, name: "Công ty ABC" }], subMerchantIds: [], permissions: ["VIEW_ESCROW"] };
let ledgerQuery: URLSearchParams | undefined;

function serve(standing: object = standingFixture) {
  mswServer.use(
    http.get(be, () => HttpResponse.json({ success: true, data: standing })),
    http.get(`${be}/contributions`, () => HttpResponse.json({ success: true, data: contributionsFixture })),
    http.get(`${be}/ledger`, ({ request }) => {
      ledgerQuery = new URL(request.url).searchParams;
      return HttpResponse.json({ success: true, data: ledgerPage() });
    }),
  );
}

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await EscrowPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  ledgerQuery = undefined;
  serve();
});
afterEach(cleanup);

describe("escrow page", () => {
  it("denies access without VIEW_ESCROW", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_BALANCE"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
    expect(ledgerQuery).toBeUndefined();
  });

  it("denies a session assigned only to Subs, which the BE answers with 404", async () => {
    getServerSession.mockResolvedValue({ ...session, merchantIds: [], merchants: [] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });

  it("shows the requirement, balance and shortfall of the Master", async () => {
    await renderPage();
    const standing = screen.getByRole("region", { name: "Tình trạng ký quỹ" });
    expect(standing).toHaveTextContent("Còn thiếu");
    expect(standing).toHaveTextContent("100.000.000");
    expect(standing).toHaveTextContent("60.000.000");
    expect(standing).toHaveTextContent("40.000.000");
  });

  it("lists who contributed and the ledger, reading the ledger page from the URL", async () => {
    await renderPage({ page: "2" });
    expect(ledgerQuery?.get("page")).toBe("2");
    expect(within(screen.getByRole("region", { name: "Đóng góp theo bên" })).getByText("SUB001 · Cửa hàng A")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Sổ ký quỹ" })).getAllByText("Nạp từ doanh thu Sub")).toHaveLength(2);
  });

  it("hides the balance instead of showing zero when the ledger cannot be read", async () => {
    serve({ ...standingFixture, state: "UNKNOWN", balance: null, shortfall: null, surplus: null, percent: null });
    await renderPage();
    const standing = screen.getByRole("region", { name: "Tình trạng ký quỹ" });
    expect(standing).toHaveTextContent("Chưa xác định");
    expect(standing).not.toHaveTextContent("60.000.000");
    expect(within(standing).getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("explains a Master without escrow requirement", async () => {
    serve({ ...standingFixture, state: "NOT_CONFIGURED", requiredAmount: 0, balance: 0, shortfall: null, surplus: null, percent: null, deadlineAt: null, daysLeft: null, allowTransfer: null, allowSetoff: null });
    await renderPage();
    expect(screen.getByText("Flexpay chưa đặt mức ký quỹ cho đơn vị của bạn.")).toBeInTheDocument();
  });
});
