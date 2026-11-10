// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { detailFixture, detailWithTerminalFixture, itemId, rowFixture, subId, totalsFixture } from "../../test/fixtures";
import { SettlementItemsContainer } from "../SettlementItemsContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/settlement-items",
  useSearchParams: () => new URLSearchParams(),
}));

const base = "/api/v1/admin/settlement-items";
const filter = { paidFrom: "2026-10-08", paidTo: "2026-10-14", page: 1, pageSize: 20 };
const choices = [{ id: subId, label: "SUB001 · Cửa hàng A" }];

function renderContainer(current: Parameters<typeof SettlementItemsContainer>[0]["filter"] = filter, canFilterTerminal = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <SettlementItemsContainer filter={current} choices={choices} canFilterTerminal={canFilterTerminal} />
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
    expect(await screen.findByText("Không có đơn hàng nào trong khoảng ngày đã chọn.")).toBeInTheDocument();
  });

  it("shows each tranche with its status and the range totals", async () => {
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("MO20261013000123")).toBeInTheDocument();
    expect(within(table).getByText("Chờ quyết toán")).toBeInTheDocument();
    expect(within(table).getByText("Đang giữ")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Tổng của 128 đơn hàng/ })).toHaveTextContent("12.800.000");
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

  it("searches every Sub with the chosen dates and returns to page 1", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/settlement-items?paidFrom=2026-10-08&paidTo=2026-10-14&page=1&pageSize=20");
  });

  it("labels the order code as such, with the transaction code and Sub · Terminal underneath", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({
      rows: [{ ...rowFixture, subMerchantCode: "MC000001-S001", subMerchantName: "Halo tech", transactionCode: "FM26ABCDE", terminalCode: "T0001", terminalType: "QR" }],
      total: 1,
      totals: totalsFixture,
    })));
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Mã đơn hàng" })).toBeInTheDocument();
    expect(within(table).queryByRole("columnheader", { name: "Mã giao dịch" })).not.toBeInTheDocument();
    expect(within(table).getByText("FM26ABCDE")).toBeInTheDocument();
    expect(within(table).getByText("Halo tech")).toBeInTheDocument();
    expect(within(table).getByText("S001 · T0001 · QR")).toBeInTheDocument();
  });

  it("splits recognised revenue by tranche group and lets a Sub be picked from the split by Sub", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({
      rows: [rowFixture],
      total: 1,
      totals: {
        ...totalsFixture,
        recognisedAmount: 248_000,
        byTrancheStatus: { IN_WITHDRAWAL: 60_000, PAID: 28_000, PENDING_SETTLEMENT: 135_000, HELD: 25_000 },
        bySub: [{ subMerchantId: subId, subMerchantCode: "S001", subMerchantName: "Halo tech", count: 3, grossAmount: 250_000, feeAmount: 2_000, recognisedAmount: 248_000, firstTrancheAmount: 223_000, heldAmount: 25_000 }],
      },
    })));
    renderContainer();
    const split = await screen.findByRole("list", { name: "Phân bổ theo trạng thái đợt" });
    expect(within(split).getByText("Đã vào lệnh rút").parentElement).toHaveTextContent("88.000");
    expect(within(split).getByText("Chờ quyết toán").parentElement).toHaveTextContent("135.000");
    await userEvent.click(screen.getByRole("button", { name: "Lọc theo Halo tech" }));
    expect(push).toHaveBeenCalledWith(`/settlement-items?paidFrom=2026-10-08&paidTo=2026-10-14&page=1&pageSize=20&subMerchantId=${subId}`);
  });

  it("does not offer the split by Sub once a Sub is chosen", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({
      rows: [rowFixture],
      total: 1,
      totals: { ...totalsFixture, bySub: [{ subMerchantId: subId, subMerchantCode: "S001", subMerchantName: "Halo tech", count: 1, grossAmount: 1, feeAmount: 0, recognisedAmount: 1, firstTrancheAmount: 1, heldAmount: 0 }] },
    })));
    renderContainer({ ...filter, subMerchantId: subId });
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: "Lọc theo Halo tech" })).not.toBeInTheDocument();
  });

  // Mục 12: BE chi tiết không gửi 4 trường trạng thái đợt của dòng danh sách; drawer phải mở được thay vì báo sự cố.
  it("opens the detail exactly as the BE sends it and shows the Sub and Terminal", async () => {
    mswServer.use(http.get(`${base}/${itemId}`, () => HttpResponse.json(detailWithTerminalFixture)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Xem chi tiết MO20261013000123" }));
    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("MC000001-S001 · Halo tech")).toBeInTheDocument();
    expect(within(sheet).getByText("Quầy 1 (T0001 · QR)")).toBeInTheDocument();
    expect(within(sheet).getByText("FM26ABCDE")).toBeInTheDocument();
  });

  it("hides the split by tranche while filtering on a tranche group and says why", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({
      rows: [rowFixture],
      total: 1,
      totals: { ...totalsFixture, byTrancheStatus: { HELD: 100, READY: 200 } },
    })));
    renderContainer({ ...filter, trancheStatus: "HELD" });
    await screen.findByRole("table");
    expect(screen.getByText("Thanh phân bổ chỉ hiện khi xem tất cả trạng thái.")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Phân bổ theo trạng thái đợt" })).not.toBeInTheDocument();
  });

  it("notes the Terminal limit when the session has more Terminals than one load", async () => {
    const terminal = { id: "22222222-2222-4222-8222-222222222222", tid: "T0001", name: "Quầy 1" };
    mswServer.use(http.get("/api/v1/admin/terminals", () => HttpResponse.json({ rows: [terminal], total: 150 })));
    renderContainer(filter, true);
    expect(await screen.findByText("Chỉ hiện 100 Terminal đầu; chọn Sub-merchant để thu hẹp.")).toBeInTheDocument();
  });
});
