// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { shiftVnDate, vnToday } from "@/lib/utils/vn-time";
import {
  SUB_ID, freezeMovement, movementTotals, orderDetail, orderMovement, setoffWithdrawalMovement, withdrawalMovement,
} from "../../test/movement-fixtures";
import { SubBalanceMovementsDialog } from "../SubBalanceMovementsDialog";

const listUrl = `/api/v1/admin/sub-balances/${SUB_ID}/movements`;
const detailUrl = `${listUrl}/:op`;

type ListOptions = { content?: unknown[]; total?: number; fail?: boolean; summary?: unknown };

/** Serves the list and records the query string of every list request. */
function serve({ content = [orderMovement, withdrawalMovement], total = content.length, fail = false, summary = null }: ListOptions = {}) {
  const queries: URLSearchParams[] = [];
  mswServer.use(
    http.get(listUrl, ({ request }) => {
      const url = new URL(request.url);
      queries.push(url.searchParams);
      if (fail) return HttpResponse.json({ message: "Hệ thống bận" }, { status: 503 });
      const page = Number(url.searchParams.get("page") ?? 1);
      return HttpResponse.json({ rows: page === 1 ? content : [freezeMovement], total, summary });
    }),
    http.get(detailUrl, () => HttpResponse.json(orderDetail)),
  );
  return queries;
}

async function openDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SubBalanceMovementsDialog subMerchantId={SUB_ID} subCode="SUB001" subName="Cửa hàng A" availableBalance={5_000_000} />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Xem biến động số dư" }));
  return user;
}

afterEach(cleanup);

describe("SubBalanceMovementsDialog", () => {
  it("opens with the title and the Sub and current available balance as subtitle", async () => {
    serve();
    await openDialog();
    expect(await screen.findByRole("heading", { name: "Biến động số dư khả dụng" })).toBeInTheDocument();
    expect(screen.getByText(/SUB001 · Cửa hàng A · Số dư khả dụng hiện tại 5\.000\.000 vnđ/)).toBeInTheDocument();
  });

  it("sends no request until the dialog is opened", () => {
    const queries = serve();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <SubBalanceMovementsDialog subMerchantId={SUB_ID} subCode="SUB001" subName="Cửa hàng A" availableBalance={0} />
      </QueryClientProvider>,
    );
    expect(queries).toHaveLength(0);
  });

  it("lists rows with label, reference and time, signed amount and balance after", async () => {
    serve();
    await openDialog();
    const credit = await screen.findByRole("button", { name: /Đơn hàng · quyết toán/ });
    expect(credit).toHaveTextContent("DH2611090070 · 10/11/2026 07:05");
    expect(credit).toHaveTextContent("+1.330.200 vnđ");
    expect(credit).toHaveTextContent("Số dư 8.714.500 vnđ");
    const debit = screen.getByRole("button", { name: /Lệnh rút/ });
    // A real minus sign (U+2212), not a hyphen, and no reference when the BE has none.
    expect(debit).toHaveTextContent("−2.000.000 vnđ");
    expect(debit).toHaveTextContent("09/11/2026 15:00");
    expect(debit).not.toHaveTextContent("null");
  });

  it("asks for all types over the last 7 days by default", async () => {
    const queries = serve();
    await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    const first = queries[0]!;
    expect(first.get("type")).toBe("ALL");
    expect(first.get("toDate")).toBe(vnToday());
    expect(first.get("fromDate")).toBe(shiftVnDate(vnToday(), -6));
    expect(first.get("page")).toBe("1");
  });

  it("filters by type through the chips", async () => {
    const queries = serve();
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("radio", { name: "Hoàn tiền" }));
    await waitFor(() => expect(queries.at(-1)?.get("type")).toBe("REFUND"));
  });

  it("has no Ký quỹ chip: escrow returns are listed under Tất cả", async () => {
    serve();
    await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    const chips = within(screen.getByRole("radiogroup", { name: "Loại biến động" })).getAllByRole("radio").map((chip) => chip.textContent);
    expect(chips).toEqual(["Tất cả", "Đơn hàng", "Lệnh rút", "Hoàn tiền", "Đóng băng"]);
  });

  it("offers 7, 30, 90 days and a custom range, 7 days selected", async () => {
    serve();
    await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    const ranges = within(screen.getByRole("radiogroup", { name: "Khoảng thời gian" })).getAllByRole("radio");
    expect(ranges.map((chip) => chip.textContent)).toEqual(["7 ngày", "30 ngày", "90 ngày", "Tùy chỉnh"]);
    expect(screen.getByRole("radio", { name: "7 ngày" })).toHaveAttribute("aria-checked", "true");
  });

  it("switches the range to 30 and 90 days", async () => {
    const queries = serve();
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("radio", { name: "30 ngày" }));
    await waitFor(() => expect(queries.at(-1)?.get("fromDate")).toBe(shiftVnDate(vnToday(), -29)));
    await user.click(screen.getByRole("radio", { name: "90 ngày" }));
    await waitFor(() => expect(queries.at(-1)?.get("fromDate")).toBe(shiftVnDate(vnToday(), -89)));
  });

  it("shows the period totals: opening, in, out and closing balance", async () => {
    serve({ summary: movementTotals });
    await openDialog();
    const strip = await screen.findByRole("group", { name: "Tổng kỳ" });
    expect(within(strip).getByText("Đầu kỳ")).toBeInTheDocument();
    expect(within(strip).getByText("Tổng cộng vào")).toBeInTheDocument();
    expect(within(strip).getByText("+1.791.000 vnđ")).toBeInTheDocument();
    expect(within(strip).getByText("Tổng trừ ra")).toBeInTheDocument();
    expect(within(strip).getByText("−1.568.000 vnđ")).toBeInTheDocument();
    expect(within(strip).getByText("Cuối kỳ")).toBeInTheDocument();
    expect(within(strip).getByText("223.000 vnđ")).toBeInTheDocument();
    expect(within(strip).getByText("Tổng gộp, gồm cả khoản giữ rồi trả lại (lệnh rút bị từ chối, gỡ đóng băng).")).toBeInTheDocument();
  });

  it("says the totals could not be added up when the period is too long, but keeps opening and closing", async () => {
    serve({ summary: { openingBalance: 10, totalIn: null, totalOut: null, closingBalance: 99, totalsComplete: false } });
    await openDialog();
    const strip = await screen.findByRole("group", { name: "Tổng kỳ" });
    expect(within(strip).getByText("99 vnđ")).toBeInTheDocument();
    expect(within(strip).getAllByText("Chưa cộng được, thu hẹp kỳ để xem")).toHaveLength(2);
  });

  it("hides the totals strip when the BE sends none", async () => {
    serve();
    await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    expect(screen.queryByRole("group", { name: "Tổng kỳ" })).not.toBeInTheDocument();
  });

  it("says how much of a withdrawal went to the escrow", async () => {
    serve({ content: [setoffWithdrawalMovement] });
    await openDialog();
    const row = await screen.findByRole("button", { name: /Lệnh rút/ });
    expect(row).toHaveTextContent("trong đó cấn trừ ký quỹ 1.000.000 vnđ");
  });

  it("labels the order code of an order row as Mã đơn hàng", async () => {
    serve();
    await openDialog();
    const credit = await screen.findByRole("button", { name: /Đơn hàng · quyết toán/ });
    expect(credit).toHaveTextContent("Mã đơn hàng DH2611090070");
  });

  it("uses the dates typed in the custom range", async () => {
    const queries = serve();
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("radio", { name: "Tùy chỉnh" }));
    const from = await screen.findByLabelText("Từ ngày");
    await user.clear(from);
    await user.type(from, "2026-11-01");
    await waitFor(() => expect(queries.at(-1)?.get("fromDate")).toBe("2026-11-01"));
  });

  it("loads the next page with Xem thêm and hides the button when everything is loaded", async () => {
    const queries = serve({ total: 3 });
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("button", { name: "Xem thêm" }));
    expect(await screen.findByRole("button", { name: /Đóng băng/ })).toBeInTheDocument();
    expect(queries.at(-1)?.get("page")).toBe("2");
    expect(screen.queryByRole("button", { name: "Xem thêm" })).not.toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    serve({ content: [] });
    await openDialog();
    expect(await screen.findByText("Không có biến động trong khoảng thời gian này.")).toBeInTheDocument();
  });

  it("shows a Vietnamese error with a retry", async () => {
    serve({ fail: true });
    await openDialog();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được biến động số dư");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("opens the detail of a row, renders its lines generically and goes back keeping the filter", async () => {
    const queries = serve();
    const user = await openDialog();
    await user.click(await screen.findByRole("radio", { name: "Hoàn tiền" }));
    await waitFor(() => expect(queries.at(-1)?.get("type")).toBe("REFUND"));
    await user.click(await screen.findByRole("button", { name: /Đơn hàng · quyết toán/ }));

    expect(await screen.findByRole("heading", { name: "Đơn hàng · quyết toán" })).toBeInTheDocument();
    expect(screen.getByText("Số dư khả dụng sau giao dịch 8.714.500 vnđ")).toBeInTheDocument();
    expect(screen.getByText("+1.330.200 vnđ", { selector: "p" })).toBeInTheDocument();

    // Plain text line (amount null), signed negative line, indent with note, emphasis line.
    expect(screen.getByText("09/11/2026 14:52")).toBeInTheDocument();
    expect(screen.getByText("−22.000 vnđ")).toBeInTheDocument();
    const held = screen.getByText("Tạm giữ theo quy tắc").closest("div[data-indent]");
    expect(held).toHaveAttribute("data-indent", "true");
    expect(within(held as HTMLElement).getByText("Giải phóng 17/11/2026")).toBeInTheDocument();
    const emphasis = screen.getByText("Quyết toán vào khả dụng").closest("div[data-emphasis]");
    expect(emphasis).toHaveAttribute("data-emphasis", "true");
    expect(within(emphasis as HTMLElement).getByText("+1.330.200 vnđ")).toHaveClass("text-success");

    const link = screen.getByRole("link", { name: "Mở đơn hàng" });
    expect(link).toHaveAttribute("href", "/order?orderCode=DH2611090070");

    await user.click(screen.getByRole("button", { name: "Quay lại danh sách" }));
    expect(await screen.findByRole("button", { name: /Lệnh rút/ })).toBeInTheDocument();
    // The list comes back from the cache with the chip still on Hoàn tiền; it must not refetch with another type.
    expect(queries.at(-1)?.get("type")).toBe("REFUND");
  });

  it("hides the business button when the BE sends no link", async () => {
    serve();
    mswServer.use(http.get(detailUrl, () => HttpResponse.json({ ...orderDetail, link: null })));
    const user = await openDialog();
    await user.click(await screen.findByRole("button", { name: /Đơn hàng · quyết toán/ }));
    await screen.findByRole("heading", { name: "Đơn hàng · quyết toán" });
    expect(screen.queryByRole("link", { name: /Mở / })).not.toBeInTheDocument();
  });

  it("shows an error in the detail view with a way back", async () => {
    serve();
    mswServer.use(http.get(detailUrl, () => HttpResponse.json({ message: "Không tìm thấy dữ liệu" }, { status: 404 })));
    const user = await openDialog();
    await user.click(await screen.findByRole("button", { name: /Đơn hàng · quyết toán/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được chi tiết");
    await user.click(screen.getByRole("button", { name: "Quay lại danh sách" }));
    expect(await screen.findByRole("button", { name: /Lệnh rút/ })).toBeInTheDocument();
  });

  it("opens as a full-height drawer that fits the viewport width on small screens", async () => {
    serve();
    await openDialog();
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("h-full");
    expect(dialog.className).toContain("w-full");
    expect(dialog.className).toContain("overflow-x-hidden");
  });
});

vi.mock("next/navigation", () => ({ usePathname: () => "/sub-balances", useRouter: () => ({ push: vi.fn() }) }));
