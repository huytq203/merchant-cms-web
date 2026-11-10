// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { calendarFixture, holdItemFixture, releasedItemFixture, subId } from "@/features/hold-calendar/test/fixtures";

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

let itemQueries: URLSearchParams[] = [];

/** Lịch theo một Sub ở `/hold-calendar/{sub}`, mọi Sub ở `/hold-calendar`. */
function serve(calendar: object = calendarFixture) {
  const answer = ({ request }: { request: Request }) => {
    requested = new URL(request.url);
    return HttpResponse.json({ success: true, data: calendar });
  };
  mswServer.use(
    http.get(`https://merchant.test/api/v1/merchant/hold-calendar/${subId}`, answer),
    http.get("https://merchant.test/api/v1/merchant/hold-calendar", answer),
    http.get("/api/v1/admin/hold-calendar/items", ({ request }) => {
      const query = new URL(request.url).searchParams;
      itemQueries.push(query);
      const rows = query.get("state") === "ALL" ? [holdItemFixture, releasedItemFixture] : [holdItemFixture];
      return HttpResponse.json({ rows, total: rows.length });
    }),
  );
}

async function renderPage(searchParams: Record<string, string> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{await HoldCalendarPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement}</QueryClientProvider>);
}

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  requested = undefined;
  itemQueries = [];
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

  // Quy tắc 10/11: mặc định 7 ngày; mục 14: mặc định mọi Sub trong phạm vi phiên.
  it("asks for every Sub over 7 days by default and shows the four figures", async () => {
    await renderPage();
    expect(requested?.pathname).toBe("/api/v1/merchant/hold-calendar");
    expect(requested?.searchParams.get("range")).toBe("DAYS_7");
    const summary = screen.getByRole("region", { name: "Tổng quan tạm giữ" });
    expect(summary).toHaveTextContent("Đang giữ");
    expect(summary).toHaveTextContent("5.000.000");
    expect(summary).toHaveTextContent("Giải phóng 7 ngày tới");
    expect(summary).toHaveTextContent("3.300.000");
    expect(summary).toHaveTextContent("Đã giải phóng 30 ngày qua");
    expect(summary).toHaveTextContent("10.000");
    expect(summary).toHaveTextContent("Hủy do hoàn tiền");
  });

  it("reads one Sub the session may pick and ignores an unknown range", async () => {
    await renderPage({ subMerchantId: subId, range: "DAYS_90" });
    expect(requested?.pathname).toBe(`/api/v1/merchant/hold-calendar/${subId}`);
    expect(requested?.searchParams.get("range")).toBe("DAYS_90");
    await renderPage({ range: "DAYS_365" });
    expect(requested?.searchParams.get("range")).toBe("DAYS_7");
  });

  it("lists each hold with its order code, and the released ones once asked", async () => {
    await renderPage();
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Mã đơn hàng" })).toBeInTheDocument();
    expect(within(table).getByText("HOLDTEST-1110161321")).toBeInTheDocument();
    expect(within(table).getByText("FM26ABCDE")).toBeInTheDocument();
    expect(within(table).getByText("Halo tech · T0001")).toBeInTheDocument();
    expect(within(table).getByText("Đang giữ · còn 3 ngày")).toBeInTheDocument();
    expect(itemQueries[0]?.get("state")).toBe("HOLDING");
    expect(itemQueries[0]?.has("subMerchantId")).toBe(false);

    await userEvent.click(screen.getByRole("switch", { name: "Hiện khoản đã giải phóng" }));
    expect(await within(await screen.findByRole("table")).findByText("DH261106-105016")).toBeInTheDocument();
    expect(itemQueries.at(-1)?.get("state")).toBe("ALL");
    expect(itemQueries.at(-1)?.get("from")).toBe("2026-09-14");
  });

  it("shows the BE notes verbatim and warns when the calendar does not match the ledger", async () => {
    serve({ ...calendarFixture, reconciles: false, notes: [...calendarFixture.notes, "Cảnh báo đối soát: lệch 200.000"] });
    await renderPage();
    expect(screen.getByText("Đây là ước tính, không phải cam kết chi trả.")).toBeInTheDocument();
    expect(screen.getByText("Lệch sổ cái")).toBeInTheDocument();
  });
});
