// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { calendarFixture, subId } from "@/features/hold-calendar/test/fixtures";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/hold-calendar",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/utils/vn-time", async (original) => ({
  ...(await original<typeof import("@/lib/utils/vn-time")>()),
  vnToday: () => "2026-10-13",
}));
import HoldCalendarPage from "../page";

const session = { merchantIds: [], subMerchantIds: [subId], permissions: ["VIEW_HOLD"] };
let requested: URL | undefined;

function serve(calendar: object = calendarFixture) {
  mswServer.use(http.get(`https://merchant.test/api/v1/merchant/hold-calendar/${subId}`, ({ request }) => {
    requested = new URL(request.url);
    return HttpResponse.json({ success: true, data: calendar });
  }));
}

async function renderPage(searchParams: Record<string, string> = {}) {
  render(await HoldCalendarPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  requested = undefined;
  serve();
});
afterEach(cleanup);

describe("hold calendar page", () => {
  it("denies access without VIEW_HOLD", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_BALANCE"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
    expect(requested).toBeUndefined();
  });

  it("asks for 30 days by default and labels the totals with that range", async () => {
    await renderPage();
    expect(requested?.searchParams.get("range")).toBe("DAYS_30");
    const summary = screen.getByRole("region", { name: "Tổng quan tạm giữ" });
    expect(summary).toHaveTextContent("Giải phóng trong 30 ngày");
    expect(summary).toHaveTextContent("3.300.000");
  });

  it("passes a valid range and ignores an unknown one", async () => {
    await renderPage({ range: "DAYS_90" });
    expect(requested?.searchParams.get("range")).toBe("DAYS_90");
    await renderPage({ range: "DAYS_365" });
    expect(requested?.searchParams.get("range")).toBe("DAYS_30");
  });

  it("names today's row, which also carries the overdue holds", async () => {
    await renderPage();
    const table = screen.getByRole("table");
    expect(within(table).getByText("Hôm nay, gồm khoản đã quá ngày")).toBeInTheDocument();
    expect(within(table).getByText("Thứ Năm")).toBeInTheDocument();
  });

  it("shows the BE notes verbatim and warns when the calendar does not match the ledger", async () => {
    serve({ ...calendarFixture, reconciles: false, notes: [...calendarFixture.notes, "Cảnh báo đối soát: lệch 200.000"] });
    await renderPage();
    expect(screen.getByText("Đây là ước tính, không phải cam kết chi trả.")).toBeInTheDocument();
    expect(screen.getByText("Lệch sổ cái")).toBeInTheDocument();
  });
});
