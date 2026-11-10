// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { shiftVnDate, vnToday } from "@/lib/utils/vn-time";
import {
  SUB_ID, freezeMovement, orderDetail, orderMovement, withdrawalMovement,
} from "../../test/movement-fixtures";
import { SubBalanceMovementsDialog } from "../SubBalanceMovementsDialog";

const listUrl = `/api/v1/admin/sub-balances/${SUB_ID}/movements`;
const detailUrl = `${listUrl}/:op`;

type ListOptions = { content?: unknown[]; total?: number; fail?: boolean };

/** Serves the list and records the query string of every list request. */
function serve({ content = [orderMovement, withdrawalMovement], total = content.length, fail = false }: ListOptions = {}) {
  const queries: URLSearchParams[] = [];
  mswServer.use(
    http.get(listUrl, ({ request }) => {
      const url = new URL(request.url);
      queries.push(url.searchParams);
      if (fail) return HttpResponse.json({ message: "Hệ thống bận" }, { status: 503 });
      const page = Number(url.searchParams.get("page") ?? 1);
      return HttpResponse.json({ rows: page === 1 ? content : [freezeMovement], total });
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

  it("switches the range to 30 days", async () => {
    const queries = serve();
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("combobox", { name: "Khoảng thời gian" }));
    await user.click(await screen.findByRole("option", { name: "30 ngày" }));
    await waitFor(() => expect(queries.at(-1)?.get("fromDate")).toBe(shiftVnDate(vnToday(), -29)));
  });

  it("uses the dates typed in the custom range", async () => {
    const queries = serve();
    const user = await openDialog();
    await screen.findByRole("button", { name: /Lệnh rút/ });
    await user.click(screen.getByRole("combobox", { name: "Khoảng thời gian" }));
    await user.click(await screen.findByRole("option", { name: "Tùy chọn" }));
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

  it("keeps the dialog inside the viewport width on small screens", async () => {
    serve();
    await openDialog();
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("overflow-x-hidden");
    expect(dialog.className).toContain("max-w-");
  });
});

vi.mock("next/navigation", () => ({ usePathname: () => "/sub-balances", useRouter: () => ({ push: vi.fn() }) }));
