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
import { BE_TRANSACTION } from "../../test/transaction.fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/transaction",
}));
vi.mock("sonner", () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const listPath = "/api/v1/admin/merchants/transaction";
const filter: TransactionListFilter = { page: 1, pageSize: 10 };
const abilities = { canRefund: true, canDispute: true, canExport: true };
const successRow: Transaction = {
  ...BE_TRANSACTION,
  id: "11111111-1111-4111-8111-111111111111",
  transactionCode: "TRX-1",
  status: "SUCCESS",
};
const failedRow: Transaction = {
  ...successRow,
  id: "22222222-2222-4222-8222-222222222222",
  transactionCode: "TRX-2",
  status: "FAILED",
};

function renderContainer(props: Partial<{ abilities: typeof abilities }> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TransactionsContainer
        filter={filter}
        abilities={props.abilities ?? abilities}
      />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Transaction[]) {
  mswServer.use(
    http.get(listPath, () => HttpResponse.json({ rows, total: rows.length })),
  );
}

beforeEach(() => {
  listReturns([successRow, failedRow]);
  mswServer.use(
    http.get("/api/v1/admin/sub-merchants", () =>
      HttpResponse.json({ rows: [], total: 0 }),
    ),
  );
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

    mswServer.use(
      http.get(listPath, () =>
        HttpResponse.json({ message: "Không tải được" }, { status: 502 }),
      ),
    );
    const failed = renderContainer();
    // The query retries a failure once before showing the error state.
    expect(
      await screen.findByRole("alert", {}, { timeout: 4000 }),
    ).toHaveTextContent("Không tải được");
    failed.unmount();

    mswServer.use(
      http.get(listPath, () =>
        HttpResponse.json({ message: "x" }, { status: 501 }),
      ),
    );
    const unsupported = renderContainer();
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
    unsupported.unmount();

    listReturns([]);
    const empty = renderContainer();
    expect(
      await screen.findByText("Không tìm thấy giao dịch nào phù hợp"),
    ).toBeInTheDocument();
    empty.unmount();

    listReturns([successRow]);
    renderContainer();
    expect(await screen.findByText("TRX-1")).toBeInTheDocument();
  });
});

describe("transactions filters", () => {
  it("offers the Sub-merchant filter and no customer phone field: the BE stores no payer phone", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const filters = within(screen.getByRole("form", { name: "Bộ lọc tìm kiếm" }));
    expect(filters.getByText("Sub-merchant")).toBeInTheDocument();
    expect(filters.queryByText(/SĐT/)).not.toBeInTheDocument();
    expect(filters.queryByText("Loại giao dịch")).not.toBeInTheDocument();
  });
});

describe("transactions container behavior", () => {
  it("offers a refund only for successful transactions the user may refund", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    expect(
      screen.getByRole("button", { name: /Hoàn tiền giao dịch TRX-1/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Hoàn tiền giao dịch TRX-2/ }),
    ).not.toBeInTheDocument();
    cleanup();
    renderContainer({ abilities: { ...abilities, canRefund: false } });
    await screen.findByText("TRX-1");
    expect(
      screen.queryByRole("button", { name: /Hoàn tiền giao dịch/ }),
    ).not.toBeInTheDocument();
  });

  it("hides the export button without the export permission", async () => {
    renderContainer({ abilities: { ...abilities, canExport: false } });
    await screen.findByText("TRX-1");
    expect(
      screen.queryByRole("button", { name: /Xuất báo cáo/ }),
    ).not.toBeInTheDocument();
  });

  it("offers the export button in the page header with the export permission", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("button", { name: /Xuất báo cáo/ }),
    ).toBeInTheDocument();
  });

  it("writes the search into the URL starting from the first page", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    await userEvent.type(
      screen.getByRole("textbox", { name: /Mã giao dịch/ }),
      "TRX-9",
    );
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/transaction");
    expect(url.searchParams.get("keyword")).toBe("TRX-9");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("searches by status and payment method chosen in the filter", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await userEvent.click(
      within(filters).getByRole("combobox", { name: /Trạng thái/ }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Thất bại" }),
    );
    await userEvent.click(
      within(filters).getByRole("combobox", { name: /Phương thức thanh toán/ }),
    );
    await userEvent.click(
      await screen.findByRole("option", { name: "Tài khoản định danh" }),
    );
    await userEvent.click(
      within(filters).getByRole("button", { name: "Tìm kiếm" }),
    );
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("status")).toBe("FAILED");
    expect(url.searchParams.get("paymentMethod")).toBe("VIRTUAL_ACCOUNT");
  });

  it("filters the created date with one range field", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    const filters = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    expect(within(filters).getByText("Ngày tạo")).toBeInTheDocument();
    expect(
      within(filters).queryByText("Từ ngày (tạo)"),
    ).not.toBeInTheDocument();
  });

  it("opens the detail from the transaction code as well as from the row action", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "TRX-1" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("TRX-1");
  });

  it("shows the order, Sub-merchant and received amount of a BE row", async () => {
    renderContainer();
    await screen.findByText("TRX-1");
    expect(screen.getAllByText("DH261102-2208").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Halo Láng").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole("button", { name: "TRX-1" }));
    const detail = await screen.findByRole("dialog");
    expect(detail).toHaveTextContent("Thực nhận");
    expect(detail).toHaveTextContent("MC000001-S001");
    expect(detail).toHaveTextContent("Vietcombank");
  });

  it("opens the detail for the chosen transaction", async () => {
    renderContainer();
    await userEvent.click(
      await screen.findByRole("button", {
        name: /Xem chi tiết giao dịch TRX-2/,
      }),
    );
    expect(await screen.findByRole("dialog")).toHaveTextContent("TRX-2");
  });
});

async function openDetailAction(name: string) {
  await userEvent.click(
    await screen.findByRole("button", { name: /Xem chi tiết giao dịch TRX-1/ }),
  );
  const detail = await screen.findByRole("dialog");
  await userEvent.click(within(detail).getByRole("button", { name }));
}

async function chooseReason(dialog: HTMLElement, name: RegExp) {
  await userEvent.click(within(dialog).getByRole("combobox"));
  await userEvent.click(await screen.findByRole("option", { name }));
}

describe("transactions refund and reconciliation dialogs", () => {
  it("opens the real refund request form for a successful transaction", async () => {
    renderContainer();
    await userEvent.click(
      await screen.findByRole("button", { name: /Hoàn tiền giao dịch TRX-1/ }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Tạo yêu cầu hoàn tiền" });
    expect(dialog).toHaveTextContent(`Giao dịch ${successRow.orderCode}`);
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("opens the shared complaint form on the transaction and requires a reason and content", async () => {
    renderContainer();
    await openDetailAction("Tra soát");
    const dialog = await screen.findByRole("dialog", { name: "Khởi tạo yêu cầu Tra soát" });
    expect(dialog).toHaveTextContent("Giao dịch: TRX-1");
    // The code comes from the transaction: nothing to type.
    expect(within(dialog).queryByRole("textbox", { name: /Mã giao dịch/ })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    expect(await within(dialog).findByText("Vui lòng chọn lý do khiếu nại")).toBeInTheDocument();
    expect(within(dialog).getByText("Vui lòng nhập nội dung khiếu nại")).toBeInTheDocument();
  });

  it("sends the request to the complaint API with the transaction code", async () => {
    const bodies: unknown[] = [];
    mswServer.use(
      http.post("/api/v1/admin/merchants/complaints", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ id: "c-1", complaintCode: "KN1" }, { status: 201 });
      }),
    );
    renderContainer();
    await openDetailAction("Tra soát");
    const dialog = await screen.findByRole("dialog", { name: "Khởi tạo yêu cầu Tra soát" });
    await chooseReason(dialog, /Sai lệch số tiền/);
    await userEvent.type(within(dialog).getByRole("textbox", { name: /Nội dung khiếu nại/ }), "Số tiền khách trả không khớp");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi yêu cầu" }));
    await vi.waitFor(() =>
      expect(bodies).toEqual([
        { transactionCode: "TRX-1", reasonCode: "AMOUNT_MISMATCH", content: "Số tiền khách trả không khớp", attachmentIds: [] },
      ]),
    );
    expect(toast.success).toHaveBeenCalledWith("Đã gửi khiếu nại KN1");
  });

  it("offers no Tra soát without CREATE_DISPUTE", async () => {
    renderContainer({ abilities: { ...abilities, canDispute: false } });
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết giao dịch TRX-1/ }));
    const detail = await screen.findByRole("dialog");
    expect(within(detail).queryByRole("button", { name: "Tra soát" })).not.toBeInTheDocument();
  });
});
