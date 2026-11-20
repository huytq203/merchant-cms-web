// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { batchListFixture, ORDER_ID, orderDetailFixture, orderPageFixture, SUB_ID } from "@/features/disbursements/test/fixtures";

const { getServerSession, redirect } = vi.hoisted(() => ({ getServerSession: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/disbursements/orders",
  useSearchParams: () => new URLSearchParams(),
}));
import OrdersPage from "../orders/page";
import OrderDetailPage from "../orders/[operationId]/page";
import BatchesPage from "../batches/page";

const base = "https://merchant.test/api/v1";
const subRow = (id: string, code: string, name: string) => ({ id, code, name, status: "ACTIVE", isDefault: false });
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_DISBURSEMENT"] };
const envelope = (data: unknown) => HttpResponse.json({ success: true, data });
const withClient = (element: ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{element}</QueryClientProvider>
);
const renderOrders = async (searchParams: Record<string, string> = {}) =>
  render(withClient(await OrdersPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement));
const renderDetail = async (operationId: string) =>
  render(withClient(await OrderDetailPage({ params: Promise.resolve({ operationId }) }) as ReactElement));
const renderBatches = async (searchParams: Record<string, string> = {}) =>
  render(withClient(await BatchesPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  mswServer.use(
    http.get(`${base}/merchant/sub-merchants/choices`, () => envelope([subRow(SUB_ID, "SUB001", "Cửa hàng A")])),
    http.post("/api/v1/admin/disbursements/search", () => HttpResponse.json(orderPageFixture)),
    http.get("/api/v1/admin/disbursements/batches", () => HttpResponse.json(batchListFixture)),
  );
});
afterEach(cleanup);

describe.each([
  ["orders", () => renderOrders()],
  ["orders/[operationId]", () => renderDetail(ORDER_ID)],
  ["batches", () => renderBatches()],
])("/disbursements/%s access", (_name, renderPage) => {
  it("denies access without VIEW_DISBURSEMENT", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_DISBURSEMENT", "EXPORT_DISBURSEMENT"] });
    await renderPage();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });

  it("redirects to session-expired when there is no session", async () => {
    getServerSession.mockResolvedValue(null);
    redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(renderPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/api/v1/admin/auth/session-expired");
  });
});

describe("/disbursements/orders", () => {
  it("lists the orders and offers the CSV export only with EXPORT_DISBURSEMENT", async () => {
    await renderOrders();
    expect(await screen.findByText("PAY-0001")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xuất CSV/ })).not.toBeInTheDocument();
    cleanup();
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT", "EXPORT_DISBURSEMENT"] });
    await renderOrders();
    expect(await screen.findByRole("button", { name: /Xuất CSV/ })).toBeInTheDocument();
  });

  it("reads the filter from the URL", async () => {
    let body: unknown;
    mswServer.use(http.post("/api/v1/admin/disbursements/search", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(orderPageFixture);
    }));
    await renderOrders({ status: "FAILED", page: "2", code: "P1", status2: "x" });
    await screen.findByText("PAY-0001");
    expect(body).toEqual({ filter: { code: "P1", statuses: ["FAILED"] }, page: 1, size: 10 });
  });
});

describe("/disbursements/orders/[operationId]", () => {
  const detailUrl = `${base}/merchant/disbursements/orders/:id`;

  it("shows the order with its Sub name", async () => {
    mswServer.use(http.get(detailUrl, () => envelope(orderDetailFixture)));
    await renderDetail(ORDER_ID);
    expect(await screen.findByText("Lệnh chi hộ PAY-0001")).toBeInTheDocument();
    expect(screen.getByText("SUB001 · Cửa hàng A")).toBeInTheDocument();
    expect(screen.getByText("FT2611180012")).toBeInTheDocument();
  });

  it("foreignOrder404ShowsNotFound: an order of a Sub outside the scope reads as not found", async () => {
    mswServer.use(http.get(detailUrl, () => HttpResponse.json({ message: "Không tìm thấy lệnh chi hộ", errorCode: "RESOURCE_NOT_FOUND" }, { status: 404 })));
    await renderDetail(ORDER_ID);
    expect(screen.getByText("Không tìm thấy lệnh chi hộ.")).toBeInTheDocument();
  });

  it("does not call BE for an id that is not a UUID", async () => {
    let called = false;
    mswServer.use(http.get(detailUrl, () => { called = true; return envelope(orderDetailFixture); }));
    await renderDetail("..%2fadmin");
    expect(screen.getByText("Không tìm thấy lệnh chi hộ.")).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it("error503ShowsRetryMessage: a BE outage reads as 'try again' with a retry button", async () => {
    mswServer.use(http.get(detailUrl, () => HttpResponse.json({ message: "x", errorCode: "MERCHANT_DISBURSEMENT_UNAVAILABLE" }, { status: 503 })));
    await renderDetail(ORDER_ID);
    expect(screen.getByText(/vui lòng thử lại sau ít phút/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("/disbursements/batches", () => {
  it("lists the batches with their progress", async () => {
    await renderBatches({ status: "SUBMITTING" });
    expect(await screen.findByText("LO-001")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lô chi hộ" })).toBeInTheDocument();
  });
});
