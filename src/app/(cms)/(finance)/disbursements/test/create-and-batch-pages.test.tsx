// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { BATCH_ID, batchDetailFixture, overviewFixture, SUB_ID } from "@/features/disbursements/test/fixtures";

const { getServerSession, redirect } = vi.hoisted(() => ({ getServerSession: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));
vi.mock("next/navigation", () => ({
  redirect,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/disbursements/new",
  useSearchParams: () => new URLSearchParams(),
}));
import NewDisbursementPage from "../new/page";
import BatchPage from "../batches/[id]/page";

const base = "https://merchant.test/api/v1";
const subRow = (id: string, code: string, name: string) => ({ id, code, name, status: "ACTIVE", isDefault: false });
const session = { merchantIds: ["m"], subMerchantIds: [], permissions: ["VIEW_DISBURSEMENT", "CREATE_DISBURSEMENT"] };
const envelope = (data: unknown) => HttpResponse.json({ success: true, data });

function mockOverview(data: unknown = overviewFixture) {
  mswServer.use(http.get(`${base}/merchant/disbursements/subs/:id/overview`, () => envelope(data)));
}
const withClient = (element: ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{element}</QueryClientProvider>
);
const renderNew = async (searchParams: Record<string, string> = {}) =>
  render(withClient(await NewDisbursementPage({ searchParams: Promise.resolve(searchParams) }) as ReactElement));
const renderBatch = async (id: string) => render(withClient(await BatchPage({ params: Promise.resolve({ id }) }) as ReactElement));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  getServerSession.mockResolvedValue(session);
  mswServer.use(http.get(`${base}/merchant/sub-merchants/choices`, () => envelope([subRow(SUB_ID, "SUB001", "Cửa hàng A")])));
  mockOverview();
});
afterEach(cleanup);

describe("/disbursements/new", () => {
  it.each([
    ["CREATE_DISBURSEMENT", ["VIEW_DISBURSEMENT"]],
    ["VIEW_DISBURSEMENT", ["CREATE_DISBURSEMENT"]],
  ])("denies access without %s", async (_missing, permissions) => {
    getServerSession.mockResolvedValue({ ...session, permissions });
    await renderNew();
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });

  it("redirects to session-expired when there is no session", async () => {
    getServerSession.mockResolvedValue(null);
    redirect.mockImplementation(() => { throw new Error("NEXT_REDIRECT"); });
    await expect(renderNew()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/api/v1/admin/auth/session-expired");
  });

  it("shows the single-order form with a request code when both channels are on", async () => {
    await renderNew();
    expect((screen.getByLabelText("Mã yêu cầu") as HTMLInputElement).value).toMatch(/^P\d{12}/);
    expect(screen.getByRole("button", { name: "Tra tên người nhận" })).toBeInTheDocument();
  });

  it("tells the user when the Sub has neither single nor batch enabled", async () => {
    mockOverview({ ...overviewFixture, service: { ...overviewFixture.service, channels: ["API"] } });
    await renderNew();
    expect(screen.getByText(/chưa bật chi hộ đơn lẻ hoặc theo lô/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Mã yêu cầu")).not.toBeInTheDocument();
  });

  it("shows only the batch upload when the Sub has only the batch channel", async () => {
    mockOverview({ ...overviewFixture, service: { ...overviewFixture.service, channels: ["BATCH"] } });
    await renderNew();
    expect(screen.queryByLabelText("Mã yêu cầu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kiểm tra file" })).toBeInTheDocument();
  });

  it("shows an empty state when the user has no Sub", async () => {
    mswServer.use(http.get(`${base}/merchant/sub-merchants/choices`, () => envelope([])));
    await renderNew();
    expect(screen.getByText(/Chưa có Sub-merchant nào/)).toBeInTheDocument();
  });
});

describe("/disbursements/batches/[id]", () => {
  const mockBatch = (data: unknown = batchDetailFixture) =>
    mswServer.use(http.get(`${base}/merchant/disbursements/batches/:id`, () => envelope(data)));

  it("denies access without VIEW_DISBURSEMENT", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["CREATE_DISBURSEMENT"] });
    await renderBatch(BATCH_ID);
    expect(screen.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeInTheDocument();
  });

  it("does not call BE for an id that is not a UUID", async () => {
    let called = false;
    mswServer.use(http.get(`${base}/merchant/disbursements/batches/:id`, () => { called = true; return envelope(batchDetailFixture); }));
    await renderBatch("..%2Fx");
    expect(called).toBe(false);
    expect(screen.getByText("Không tìm thấy lô chi hộ.")).toBeInTheDocument();
  });

  it("shows the batch with the Send button for a user with CREATE_DISBURSEMENT", async () => {
    mockBatch();
    await renderBatch(BATCH_ID);
    expect(screen.getByRole("region", { name: /Lô LO-001/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gửi lô" })).toBeInTheDocument();
  });

  it("hides the Send button for a view-only user", async () => {
    getServerSession.mockResolvedValue({ ...session, permissions: ["VIEW_DISBURSEMENT"] });
    mockBatch();
    await renderBatch(BATCH_ID);
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
  });

  it("shows the BE error message when the batch cannot be loaded", async () => {
    mswServer.use(http.get(`${base}/merchant/disbursements/batches/:id`, () =>
      HttpResponse.json({ success: false, message: "Không tìm thấy lô" }, { status: 404 })));
    await renderBatch(BATCH_ID);
    expect(screen.queryByRole("button", { name: "Gửi lô" })).not.toBeInTheDocument();
  });
});
