// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { mswServer } from "@/test/msw";
import { TransactionsContainer } from "../TransactionsContainer";
import type { Transaction, TransactionListFilter } from "../../types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/transaction" }));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

const listPath = "/api/v1/admin/merchants/transaction";
const filter: TransactionListFilter = { page: 1, pageSize: 10 };
const abilities = { canRefund: true, canDispute: true, canExport: true };
const successRow: Transaction = {
  id: "t-1",
  code: "TRX-1",
  invoiceCode: "INV-1",
  type: "payment",
  cardType: "visa",
  cardNumber: "**** **** **** 0001",
  cardHolderName: "CHU THE MAU",
  amount: 100000,
  currency: "VND",
  fee: 1000,
  netAmount: 99000,
  subMerchantId: "SM001",
  subMerchantName: "Cửa hàng mẫu A",
  customerId: "c-1",
  customerName: "Khách hàng mẫu 001",
  customerPhone: "0900000001",
  createdAt: "2026-09-01T03:00:00.000Z",
  status: "success",
  description: "Mẫu",
  referenceCode: "REF-1",
  paymentMethod: "qr",
  bankCode: "VCB",
  responseCode: "00",
  responseMessage: "OK",
};
const failedRow: Transaction = { ...successRow, id: "t-2", code: "TRX-2", status: "failed" };

function renderContainer(props: Partial<{ abilities: typeof abilities; showSubMerchantFilter: boolean }> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TransactionsContainer
        filter={filter}
        abilities={props.abilities ?? abilities}
        showSubMerchantFilter={props.showSubMerchantFilter ?? true}
      />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Transaction[]) {
  mswServer.use(http.get(listPath, () => HttpResponse.json({ rows, total: rows.length })));
}

beforeEach(() => {
  listReturns([successRow, failedRow]);
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("transactions container states", () => {
  it("shows loading, error, unsupported, empty and data states", async () => {
    mswServer.use(http.get(listPath, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    loading.unmount();

    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "Không tải được" }, { status: 502 })));
    const failed = renderContainer();
    // The query retries a failure once before showing the error state.
    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent("Không tải được");
    failed.unmount();

    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "x" }, { status: 501 })));
    const unsupported = renderContainer();
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
    unsupported.unmount();

    listReturns([]);
    const empty = renderContainer();
    expect(await screen.findByText("Không tìm thấy giao dịch nào phù hợp")).toBeInTheDocument();
    empty.unmount();

    listReturns([successRow]);
    renderContainer();
    expect(await screen.findByText("TRX-1")).toBeInTheDocument();
  });
});

describe("transactions sub-merchant filter", () => {
  it("is offered normally and hidden without calling the BE list in fixture mode", async () => {
    const requested = vi.fn();
    mswServer.use(http.get("/api/v1/admin/sub-merchants", () => {
      requested();
      return HttpResponse.json({ rows: [], total: 0 });
    }));
    renderContainer();
    await screen.findByText("TRX-1");
    expect(within(screen.getByRole("form", { name: "Bộ lọc tìm kiếm" })).getByText("Sub-merchant")).toBeInTheDocument();
    cleanup();
    requested.mockClear();
    renderContainer({ showSubMerchantFilter: false });
    await screen.findByText("TRX-1");
    expect(within(screen.getByRole("form", { name: "Bộ lọc tìm kiếm" })).queryByText("Sub-merchant")).not.toBeInTheDocument();
    expect(requested).not.toHaveBeenCalled();
  });
});

describe("transactions container behavior", () => {
  it("offers a refund only for successful transactions the user may refund", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    expect(screen.getByRole("button", { name: /Hoàn tiền giao dịch TRX-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hoàn tiền giao dịch TRX-2/ })).not.toBeInTheDocument();
    cleanup();
    renderContainer({ abilities: { ...abilities, canRefund: false } });
    await screen.findByText("TRX-1");
    expect(screen.queryByRole("button", { name: /Hoàn tiền giao dịch/ })).not.toBeInTheDocument();
  });

  it("hides the export button without the export permission", async () => {
    renderContainer({ abilities: { ...abilities, canExport: false } });
    await screen.findByText("TRX-1");
    expect(screen.queryByRole("button", { name: /Xuất báo cáo/ })).not.toBeInTheDocument();
  });

  it("offers the export button in the page header with the export permission", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("button", { name: /Xuất báo cáo/ })).toBeInTheDocument();
  });

  it("writes the search into the URL starting from the first page", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    await userEvent.type(screen.getByRole("textbox", { name: /Mã giao dịch/ }), "TRX-9");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/transaction");
    expect(url.searchParams.get("keyword")).toBe("TRX-9");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("searches by status and type chosen in the filter", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await userEvent.click(within(filters).getByRole("combobox", { name: /Trạng thái/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Thất bại" }));
    await userEvent.click(within(filters).getByRole("combobox", { name: /Loại giao dịch/ }));
    await userEvent.click(await screen.findByRole("option", { name: /Hoàn tiền/ }));
    await userEvent.click(within(filters).getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("status")).toBe("failed");
    expect(url.searchParams.get("type")).toBe("refund");
  });

  it("filters the created date with one range field", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    expect(within(filters).getByText("Ngày tạo")).toBeInTheDocument();
    expect(within(filters).queryByText("Từ ngày (tạo)")).not.toBeInTheDocument();
  });

  it("opens the detail from the transaction code as well as from the row action", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "TRX-1" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("TRX-1");
  });

  it("opens the detail for the chosen transaction", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết giao dịch TRX-2/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("TRX-2");
  });
});

async function openDetailAction(name: string) {
  await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết giao dịch TRX-1/ }));
  const detail = await screen.findByRole("dialog");
  await userEvent.click(within(detail).getByRole("button", { name }));
}

async function chooseReason(dialog: HTMLElement, name: RegExp) {
  await userEvent.click(within(dialog).getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name }));
}

describe("transactions refund and reconciliation dialogs", () => {
  it("blocks a refund without a reason and does not claim success", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hoàn tiền giao dịch TRX-1/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /Xác nhận Hoàn tiền/ }));
    expect(await within(dialog).findByText("Vui lòng chọn lý do hoàn tiền")).toBeInTheDocument();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("says a valid refund is unsupported and keeps the dialog open", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hoàn tiền giao dịch TRX-1/ }));
    const dialog = await screen.findByRole("dialog");
    await chooseReason(dialog, /Khách hàng đổi ý/);
    await userEvent.click(within(dialog).getByRole("button", { name: /Xác nhận Hoàn tiền/ }));
    await vi.waitFor(() => expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/)));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("requires a note of at least 10 characters before a reconciliation request", async () => {
    renderContainer();
    await openDetailAction("Tra soát");
    const dialog = (await screen.findAllByRole("dialog")).at(-1)!;
    await chooseReason(dialog, /Số tiền không khớp/);
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Ghi chú chi tiết/ }), "ngắn");
    await userEvent.click(within(dialog).getByRole("button", { name: /Gửi yêu cầu tra soát/ }));
    expect(await within(dialog).findByText("Ghi chú phải có ít nhất 10 ký tự")).toBeInTheDocument();
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("says a valid reconciliation request is unsupported and keeps the dialog open", async () => {
    renderContainer();
    await openDetailAction("Tra soát");
    const dialog = (await screen.findAllByRole("dialog")).at(-1)!;
    await chooseReason(dialog, /Số tiền không khớp/);
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Ghi chú chi tiết/ }), "Số tiền khách trả không khớp");
    await userEvent.click(within(dialog).getByRole("button", { name: /Gửi yêu cầu tra soát/ }));
    await vi.waitFor(() => expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/)));
    expect(within(dialog).getByRole("textbox", { name: /Ghi chú chi tiết/ })).toHaveValue("Số tiền khách trả không khớp");
  });
});
