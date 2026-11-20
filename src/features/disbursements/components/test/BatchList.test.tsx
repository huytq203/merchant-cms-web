// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { batchListFixture, SUB_ID } from "../../test/fixtures";
import type { BatchListFilter } from "../../types/types";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/disbursements/batches",
  useSearchParams: () => new URLSearchParams(),
}));
import { BatchList } from "../BatchList";

const listPath = "/api/v1/admin/disbursements/batches";
const filter: BatchListFilter = { page: 1, pageSize: 10 };

function renderList(props: { filter?: BatchListFilter } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrap = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return render(<BatchList filter={props.filter ?? filter} />, { wrapper: wrap });
}

beforeEach(() => {
  push.mockReset();
  mswServer.use(
    http.get(listPath, () => HttpResponse.json(batchListFixture)),
    http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([{ id: SUB_ID, code: "SUB001", name: "Cửa hàng A", status: "ACTIVE", isDefault: false }])),
  );
});
afterEach(cleanup);

describe("BatchList", () => {
  it("batchProgressFromSummary: a submitted batch shows finished/total and links to its orders", async () => {
    renderList();
    const row = (await screen.findByText("LO-001")).closest("tr") as HTMLElement;
    expect(within(row).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    expect(within(row).getByText("6/10 lệnh đã có kết quả")).toBeInTheDocument();
    expect(within(row).getByText("Đang gửi")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: /Xem lô/ })).toHaveAttribute("href", `/disbursements/batches/${batchListFixture.items[0]?.batch.batchId}`);
  });

  it("shows a dash instead of a progress bar for a batch that has no order yet", async () => {
    renderList();
    const row = (await screen.findByText("LO-002")).closest("tr") as HTMLElement;
    expect(within(row).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(row).getByText("Chờ gửi")).toBeInTheDocument();
  });

  it("explains when the progress could not be read but still lists the batches", async () => {
    mswServer.use(http.get(listPath, () => HttpResponse.json({ ...batchListFixture, summaryUnavailable: true, items: batchListFixture.items.map((item) => ({ ...item, summary: null })) })));
    renderList();
    expect(await screen.findByText("LO-001")).toBeInTheDocument();
    expect(screen.getByText(/Chưa đọc được tiến độ chi/)).toBeInTheDocument();
  });

  it("error503ShowsRetryMessage", async () => {
    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "Chưa đọc được dữ liệu chi hộ từ hệ thống chi, vui lòng thử lại sau ít phút", code: "6323" }, { status: 503 })));
    renderList();
    expect(await screen.findByText(/vui lòng thử lại sau ít phút/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("sends the Sub and status filter to BE and keeps them on the URL when searching", async () => {
    let query = "";
    mswServer.use(http.get(listPath, ({ request }) => {
      query = new URL(request.url).search;
      return HttpResponse.json(batchListFixture);
    }));
    renderList({ filter: { page: 2, pageSize: 10, subId: SUB_ID, status: "SUBMITTING" } });
    await screen.findByText("LO-001");
    expect(query).toContain(`subId=${SUB_ID}`);
    expect(query).toContain("status=SUBMITTING");
    expect(query).toContain("page=2");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://x");
    expect(url.searchParams.get("subId")).toBe(SUB_ID);
    expect(url.searchParams.get("status")).toBe("SUBMITTING");
    expect(url.searchParams.get("page")).toBe("1");
  });
});
