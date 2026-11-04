// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { activeFreeze, releasedFreeze, subId } from "@/features/revenue-freezes/test/fixtures";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/revenue-freezes",
  useSearchParams: () => new URLSearchParams(),
}));
import RevenueFreezesPage from "../page";

const session = { merchantIds: [], subMerchantIds: [subId], permissions: ["VIEW_BALANCE"] };
const freezesUrl = "https://merchant.test/api/v1/merchant/revenue-freezes";
let requested: URL | undefined;

function serve(rows: object[] = [activeFreeze, releasedFreeze], status = 200) {
  mswServer.use(http.get(freezesUrl, ({ request }) => {
    requested = new URL(request.url);
    return status === 200
      ? HttpResponse.json({ success: true, data: rows })
      : HttpResponse.json({ success: false, errorCode: "5796", message: "Không đọc được sổ cái" }, { status });
  }));
}

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await RevenueFreezesPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  requested = undefined;
  serve();
});
afterEach(cleanup);

describe("revenue freezes page", () => {
  it("denies access without VIEW_BALANCE and does not call the BE", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_HOLD"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
    expect(requested).toBeUndefined();
  });

  it("asks for every state of the chosen Sub by default", async () => {
    await renderPage();
    expect(requested?.searchParams.get("subId")).toBe(subId);
    expect(requested?.searchParams.has("status")).toBe(false);
    expect(screen.getByRole("heading", { name: "Đóng băng doanh thu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tất cả" })).toHaveAttribute("aria-pressed", "true");
  });

  it("sends the status from the URL and ignores one the BE does not store", async () => {
    await renderPage({ status: "ACTIVE" });
    expect(requested?.searchParams.get("status")).toBe("ACTIVE");
    cleanup();
    await renderPage({ status: "DELETED" });
    expect(requested?.searchParams.has("status")).toBe(false);
  });

  it("shows each freeze with its reason, amounts and state; a shortfall only while active", async () => {
    await renderPage();
    const active = screen.getByText("FZ2611030001").closest("tr") as HTMLElement;
    expect(within(active).getByText("ORD-0001")).toBeInTheDocument();
    expect(within(active).getByText("Khách hàng khiếu nại giao dịch")).toBeInTheDocument();
    expect(active).toHaveTextContent("1.000.000");
    expect(active).toHaveTextContent("800.000");
    expect(active).toHaveTextContent("200.000");
    expect(within(active).getByText("Đang đóng băng")).toBeInTheDocument();

    const released = screen.getByText("FZ2611020001").closest("tr") as HTMLElement;
    expect(within(released).getByText("Nghi ngờ gian lận")).toBeInTheDocument();
    expect(within(released).getByText("Đã gỡ băng")).toBeInTheDocument();
    expect(within(released).getByText("Chưa đặt hạn")).toBeInTheDocument();
  });

  it("says when there is no freeze", async () => {
    serve([]);
    await renderPage();
    expect(screen.getByText("Không có khoản đóng băng nào")).toBeInTheDocument();
  });

  it("shows the BE message when the list cannot be read", async () => {
    serve([], 409);
    await renderPage();
    expect(screen.getByText("Không đọc được sổ cái")).toBeInTheDocument();
  });
});
