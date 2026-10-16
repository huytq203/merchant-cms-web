// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { detailFixture, itemId, rowFixture, subId, totalsFixture } from "../../test/fixtures";
import { SettlementItemsContainer } from "../SettlementItemsContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/settlement-items",
  useSearchParams: () => new URLSearchParams(),
}));

const base = "/api/v1/admin/settlement-items";
const filter = { subMerchantId: subId, paidFrom: "2026-10-08", paidTo: "2026-10-14", page: 1, pageSize: 20 };
const choices = [{ id: subId, label: "SUB001 · Cửa hàng A" }];

function renderContainer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SettlementItemsContainer filter={filter} choices={choices} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [rowFixture], total: 1, totals: totalsFixture })));
});
afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("settlement items container", () => {
  it("shows a busy table while loading", () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });

  it("shows the error and retries", async () => {
    let failing = true;
    mswServer.use(http.get(base, () => (failing
      ? HttpResponse.json({ message: "Không tải được" }, { status: 500 })
      : HttpResponse.json({ rows: [rowFixture], total: 1, totals: totalsFixture }))));
    renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    failing = false;
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("explains an empty range", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [], total: 0, totals: { ...totalsFixture, count: 0 } })));
    renderContainer();
    expect(await screen.findByText("Không có giao dịch nào trong khoảng ngày đã chọn.")).toBeInTheDocument();
  });

  it("shows each tranche with its status and the range totals", async () => {
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("MO20261013000123")).toBeInTheDocument();
    expect(within(table).getByText("Chờ quyết toán")).toBeInTheDocument();
    expect(within(table).getByText("Đang giữ")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Tổng của 128 giao dịch/ })).toHaveTextContent("12.800.000");
  });

  it("opens the lines of a transaction in a side sheet", async () => {
    mswServer.use(http.get(`${base}/${itemId}`, () => HttpResponse.json(detailFixture)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Xem chi tiết MO20261013000123" }));
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("Hoàn tiền")).toBeInTheDocument();
    expect(within(sheet).getByText("Đã chi")).toBeInTheDocument();
    expect(within(sheet).getByText("Đã hủy")).toBeInTheDocument();
  });

  it("searches with the chosen dates and returns to page 1", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith(`/settlement-items?subMerchantId=${subId}&paidFrom=2026-10-08&paidTo=2026-10-14&page=1&pageSize=20`);
  });
});
