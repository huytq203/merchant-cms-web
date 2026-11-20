// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { orderPageFixture, SUB_ID } from "../../test/fixtures";
import type { OrderListFilter } from "../../types/types";

const { push, downloadDisbursementsCsv } = vi.hoisted(() => ({ push: vi.fn(), downloadDisbursementsCsv: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/disbursements/orders",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../../disbursement-queries", async () => {
  const actual = await vi.importActual<typeof import("../../disbursement-queries")>("../../disbursement-queries");
  return { ...actual, downloadDisbursementsCsv };
});
import { DisbursementList } from "../DisbursementList";

const filter: OrderListFilter = { page: 1, pageSize: 10 };
const searchPath = "/api/v1/admin/disbursements/search";
const choicesPath = "/api/v1/admin/sub-merchants/choices";

function renderList(props: { filter?: OrderListFilter; canExport?: boolean } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<DisbursementList filter={props.filter ?? filter} canExport={props.canExport ?? true} />, { wrapper: wrap });
}

beforeEach(() => {
  push.mockReset();
  downloadDisbursementsCsv.mockReset();
  mswServer.use(
    http.post(searchPath, () => HttpResponse.json(orderPageFixture)),
    http.get(choicesPath, () => HttpResponse.json([{ id: SUB_ID, code: "SUB001", name: "Cửa hàng A", status: "ACTIVE", isDefault: false }])),
  );
});
afterEach(cleanup);

describe("DisbursementList", () => {
  it("accountMaskedInListAndDetail: lists the masked account, request code, Sub and Vietnamese status", async () => {
    renderList();
    const row = (await screen.findByText("PAY-0001")).closest("tr") as HTMLElement;
    expect(within(row).getByText(/\*\*\*\*7890/)).toBeInTheDocument();
    expect(within(row).getByText("NGUYEN VAN KIEN")).toBeInTheDocument();
    expect(within(row).getByText("Thành công")).toBeInTheDocument();
    // Tên Sub đến từ danh sách lựa chọn, tải song song với danh sách lệnh.
    expect(await within(row).findByText(/Cửa hàng A/)).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: /Xem/ })).toHaveAttribute("href", `/disbursements/orders/${orderPageFixture.items[0]?.operationId}`);
    const pendingRow = screen.getByText("L11-001").closest("tr") as HTMLElement;
    expect(within(pendingRow).getByText("Chờ duyệt")).toBeInTheDocument();
    // Lệnh chưa thành công thì chưa có "Thực chi".
    expect(within(pendingRow).getAllByText("—").length).toBeGreaterThan(0);
  });

  it("does not print a UUID fragment the search box could not match", async () => {
    renderList();
    await screen.findByText("PAY-0001");
    expect(screen.queryByText(/^Lệnh [0-9a-f]{8}$/)).not.toBeInTheDocument();
  });

  it("dropping the batch filter searches again at once, keeping the other filters", async () => {
    const BATCH = "55555555-5555-4555-8555-555555555555";
    renderList({ filter: { page: 2, pageSize: 10, batchId: BATCH, status: "FAILED" } });
    await screen.findByText("PAY-0001");
    await userEvent.click(screen.getByRole("button", { name: "Bỏ lọc theo lô" }));
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://x");
    expect(url.searchParams.has("batchId")).toBe(false);
    expect(url.searchParams.get("status")).toBe("FAILED");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("sends the page filter to the search, 0-based", async () => {
    let body: unknown;
    mswServer.use(http.post(searchPath, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(orderPageFixture);
    }));
    renderList({ filter: { page: 2, pageSize: 20, status: "FAILED", code: "P1" } });
    await screen.findByText("PAY-0001");
    expect(body).toEqual({ filter: { code: "P1", statuses: ["FAILED"] }, page: 1, size: 20 });
  });

  it("exportButtonHiddenWithoutExportPermission", async () => {
    renderList({ canExport: false });
    await screen.findByText("PAY-0001");
    expect(screen.queryByRole("button", { name: /Xuất CSV/ })).not.toBeInTheDocument();
  });

  it("exportSendsSameFilters: the export button downloads with the filter on screen", async () => {
    downloadDisbursementsCsv.mockResolvedValue(undefined);
    const current: OrderListFilter = { page: 3, pageSize: 10, status: "SUCCEEDED", code: "P1" };
    renderList({ filter: current });
    await userEvent.click(await screen.findByRole("button", { name: /Xuất CSV/ }));
    await waitFor(() => expect(downloadDisbursementsCsv).toHaveBeenCalledWith(current));
  });

  it("shows the BE message when the export is refused", async () => {
    downloadDisbursementsCsv.mockRejectedValue(new Error("Vượt quá 50.000 dòng, hãy thu hẹp bộ lọc"));
    renderList();
    await userEvent.click(await screen.findByRole("button", { name: /Xuất CSV/ }));
    expect(await screen.findByText("Vượt quá 50.000 dòng, hãy thu hẹp bộ lọc")).toBeInTheDocument();
  });

  it("error503ShowsRetryMessage: shows the BE sentence and retries on demand", async () => {
    let calls = 0;
    mswServer.use(http.post(searchPath, () => {
      calls += 1;
      return calls === 1
        ? HttpResponse.json({ message: "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút", code: "6323" }, { status: 503 })
        : HttpResponse.json(orderPageFixture);
    }));
    renderList();
    expect(await screen.findByText(/vui lòng thử lại sau ít phút/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("PAY-0001")).toBeInTheDocument();
  });

  it("says there is no order yet instead of an empty table", async () => {
    mswServer.use(http.post(searchPath, () => HttpResponse.json({ items: [], total: 0, page: 0, size: 10 })));
    renderList();
    expect(await screen.findByText(/Chưa có lệnh chi hộ/)).toBeInTheDocument();
  });

  it("filtersMapToUrl: Search puts the typed code and the chosen filters on the URL and resets to page 1", async () => {
    renderList({ filter: { page: 4, pageSize: 10 } });
    await screen.findByText("PAY-0001");
    await userEvent.type(screen.getByLabelText("Mã lệnh / mã yêu cầu / mã Ref"), "  PAY-0001 ");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://x");
    expect(url.pathname).toBe("/disbursements/orders");
    expect(url.searchParams.get("code")).toBe("PAY-0001");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("does not search with a reversed amount range and says why", async () => {
    renderList();
    await screen.findByText("PAY-0001");
    await userEvent.type(screen.getByLabelText("Số tiền từ"), "900");
    await userEvent.type(screen.getByLabelText("Số tiền đến"), "100");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).not.toHaveBeenCalled();
    expect(await screen.findByText("Số tiền từ phải nhỏ hơn hoặc bằng số tiền đến")).toBeInTheDocument();
  });
});
