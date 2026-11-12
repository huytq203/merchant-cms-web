// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { OrdersContainer } from "../OrdersContainer";
import type { Order, OrderListFilter } from "../../types/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/order" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/orders";
const merchantId = "22222222-2222-4222-8222-222222222222";
const filter: OrderListFilter = { page: 1, pageSize: 10 };
const abilities = { canCreate: true, canCancel: true, canRefund: true, canViewRefunds: true, canDispute: true };
const makeOrder = (overrides: Partial<Order>): Order => ({
  id: "33333333-3333-4333-8333-333333333333",
  merchantId,
  orderCode: "INV-1",
  amount: 150000,
  currency: "VND",
  status: "ACTIVE",
  bankCode: "VCB",
  expiredAt: "2999-01-01T00:00:00",
  ...overrides,
});
const activeOrder = makeOrder({ qrCode: "qr-payload" });

function renderContainer(props: Partial<{ abilities: typeof abilities }> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrdersContainer filter={filter} abilities={props.abilities ?? abilities} />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Order[]) {
  mswServer.use(http.get(base, () => HttpResponse.json({ rows, total: rows.length })));
}

beforeEach(() => {
  listReturns([activeOrder]);
  mswServer.use(http.get(`${base}/${activeOrder.id}`, () => HttpResponse.json(activeOrder)));
  mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([])));
  mswServer.use(http.get("/api/v1/admin/terminals", () => HttpResponse.json({ rows: [], total: 0 })));
});
afterEach(() => {
  window.localStorage.clear();
  cleanup();
  vi.clearAllMocks();
});

async function chooseOption(scope: HTMLElement, field: RegExp, name: RegExp) {
  await userEvent.click(within(scope).getByRole("combobox", { name: field }));
  await userEvent.click(await screen.findByRole("option", { name }));
}

async function fillValidForm() {
  const dialog = await screen.findByRole("dialog");
  await chooseOption(dialog, /Ngân hàng/, /Vietcombank/);
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Mã đơn hàng/ }), "INV-9");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tiền/ }), "250000");
  return dialog;
}

describe("orders container states", () => {
  it("shows loading, error, empty and data states", async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    loading.unmount();
    mswServer.use(http.get(base, () => HttpResponse.json({ message: "Không tải được" }, { status: 500 })));
    const error = renderContainer();
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
    error.unmount();
    listReturns([]);
    const empty = renderContainer();
    expect(await screen.findByText("Không có đơn hàng")).toBeInTheDocument();
    empty.unmount();
    listReturns([activeOrder]);
    renderContainer();
    expect(await screen.findByText("INV-1")).toBeInTheDocument();
  });

  it("hides the create button without CREATE_ORDER", async () => {
    renderContainer({ abilities: { ...abilities, canCreate: false } });
    await screen.findByText("INV-1");
    expect(screen.queryByRole("button", { name: /Tạo đơn hàng/ })).not.toBeInTheDocument();
  });
});

describe("create order modal", () => {
  it("blocks a zero amount without calling the server", async () => {
    const posted = vi.fn();
    mswServer.use(http.post(base, () => {
      posted();
      return HttpResponse.json(activeOrder, { status: 201 });
    }));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
    await userEvent.clear(amount);
    await userEvent.type(amount, "0");
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    expect(await within(dialog).findByText("Số tiền phải lớn hơn 0")).toBeInTheDocument();
    expect(posted).not.toHaveBeenCalled();
  });

  it("posts the form once even when submitted twice, then shows the QR", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      await new Promise((resolve) => setTimeout(resolve, 50));
      return HttpResponse.json(makeOrder({ orderCode: "INV-9", qrCode: "new-qr" }), { status: 201 });
    }));
    mswServer.use(http.get(`${base}/${activeOrder.id}`, () => HttpResponse.json(makeOrder({ orderCode: "INV-9", qrCode: "new-qr" }))));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    await userEvent.dblClick(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    await waitFor(() => expect(screen.getByTitle(/Mã QR đơn INV-9/)).toBeInTheDocument());
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toMatchObject({ orderCode: "INV-9", amount: 250000, bankCode: "VCB", paymentMethod: "QR" });
  });

  it("shows a BE field error on its field and keeps the modal open", async () => {
    mswServer.use(http.post(base, () =>
      HttpResponse.json({ message: "Dữ liệu không hợp lệ", details: { amount: "Vượt hạn mức giao dịch" } }, { status: 400 }),
    ));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    expect(await within(dialog).findByText("Vượt hạn mức giao dịch")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("order actions by status", () => {
  it.each(["SUCCESS", "EXPIRED", "CANCELLED"] as const)("offers no QR action for a %s order", async (status) => {
    listReturns([makeOrder({ status })]);
    renderContainer();
    await screen.findByText("INV-1");
    expect(screen.getByRole("button", { name: /Xem chi tiết đơn INV-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xác nhận thanh toán/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xem mã QR/ })).not.toBeInTheDocument();
  });

  it("offers no manual payment confirmation even for an ACTIVE order", async () => {
    renderContainer();
    await screen.findByText("INV-1");
    expect(screen.getByRole("button", { name: /Xem mã QR đơn INV-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Xác nhận thanh toán/ })).not.toBeInTheDocument();
  });

  it("opens the customer display of an ACTIVE order in a new tab, from the row and from the QR dialog", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hiển thị cho khách đơn INV-1/ }));
    expect(open).toHaveBeenLastCalledWith(`/customer-display/order/${activeOrder.id}`, "_blank", "noopener");
    await userEvent.click(screen.getByRole("button", { name: /Xem mã QR đơn INV-1/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Hiển thị cho khách" }));
    expect(open).toHaveBeenCalledTimes(2);
  });

  it("hides the customer display without CREATE_ORDER or for a paid order", async () => {
    renderContainer({ abilities: { ...abilities, canCreate: false } });
    await screen.findByText("INV-1");
    expect(screen.queryByRole("button", { name: /Hiển thị cho khách/ })).not.toBeInTheDocument();
    cleanup();
    listReturns([makeOrder({ status: "SUCCESS" })]);
    renderContainer();
    await screen.findByText("INV-1");
    expect(screen.queryByRole("button", { name: /Hiển thị cho khách/ })).not.toBeInTheDocument();
  });

  it("hides an expired QR and shows the new one after refreshing", async () => {
    const expired = makeOrder({ expiredAt: "2000-01-01T00:00:00", qrCode: "old-qr" });
    listReturns([expired]);
    mswServer.use(http.get(`${base}/${expired.id}`, () => HttpResponse.json(expired)));
    mswServer.use(http.post(`${base}/${expired.id}/refresh-qr`, () =>
      HttpResponse.json({ ...expired, qrCode: "fresh-qr" }),
    ));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem mã QR đơn INV-1/ }));
    const refresh = await screen.findByRole("button", { name: /Làm mới QR/ });
    expect(screen.queryByTitle(/Mã QR đơn INV-1/)).not.toBeInTheDocument();
    await userEvent.click(refresh);
    await waitFor(() => expect(screen.getByTitle(/Mã QR đơn INV-1/)).toBeInTheDocument());
  });
});

describe("create order flow", () => {
  const subId = "11111111-1111-4111-8111-111111111111";
  const terminalId = "55555555-5555-4555-8555-555555555555";

  function sellerHas(terminals: { id: string; tid: string; name: string }[]) {
    mswServer.use(
      http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([
        { id: subId, code: "MC1-S001", name: "Halo tech", status: "ACTIVE", isDefault: true },
      ])),
      http.get("/api/v1/admin/terminals", () => HttpResponse.json({ rows: terminals, total: terminals.length })),
    );
  }

  it("offers the Terminals of the default Sub-merchant and sends the chosen one", async () => {
    sellerHas([{ id: terminalId, tid: "TML000001", name: "Quầy 1" }]);
    const bodies: unknown[] = [];
    mswServer.use(http.post(base, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(makeOrder({ orderCode: "INV-9", qrCode: "new-qr" }), { status: 201 });
    }));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    await chooseOption(dialog, /Terminal/, /TML000001/);
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    await screen.findByTitle(/Mã QR đơn INV-9/);
    expect(bodies[0]).toMatchObject({ terminalId });
  });

  it("groups the amount with thousand separators while keeping the digits", async () => {
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await screen.findByRole("dialog");
    const amount = within(dialog).getByRole("textbox", { name: /Số tiền/ });
    await userEvent.type(amount, "1500000");
    expect(amount).toHaveValue("1.500.000");
  });

  it("fills a generated order code on request", async () => {
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /Tạo mã đơn tự động/ }));
    const code = within(dialog).getByRole("textbox", { name: /Mã đơn hàng/ });
    expect((code as HTMLInputElement).value).toMatch(/^DH\d{6}-\d{4}$/);
  });

  it("warns when the code already belongs to an unpaid order", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [activeOrder], total: 1 })));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await screen.findByRole("dialog");
    const code = within(dialog).getByRole("textbox", { name: /Mã đơn hàng/ });
    await userEvent.type(code, "INV-1");
    await userEvent.tab();
    expect(await within(dialog).findByText(/Mã này đã có/)).toBeInTheDocument();
  });

  it("shows the result in the same dialog and returns to a fresh form for another order", async () => {
    mswServer.use(http.post(base, () =>
      HttpResponse.json(makeOrder({ orderCode: "INV-9", qrCode: "new-qr", feeAmount: 8250, netAmount: 241750 }), { status: 201 }),
    ));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    expect(await screen.findByRole("heading", { name: /Đã tạo đơn INV-9/ })).toBeInTheDocument();
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn khác/ }));
    expect(await screen.findByRole("textbox", { name: /Mã đơn hàng/ })).toHaveValue("");
  });

  it("remembers the bank used for the last order", async () => {
    mswServer.use(http.post(base, () => HttpResponse.json(makeOrder({ qrCode: "qr" }), { status: 201 })));
    renderContainer();
    await userEvent.click(screen.getByRole("button", { name: /Tạo đơn hàng/ }));
    const dialog = await fillValidForm();
    await userEvent.click(within(dialog).getByRole("button", { name: "Tạo đơn hàng" }));
    await userEvent.click(await screen.findByRole("button", { name: /Tạo đơn khác/ }));
    expect(await screen.findByRole("combobox", { name: /Ngân hàng/ })).toHaveTextContent("Vietcombank");
  });
});

describe("order list filters", () => {
  it("searches by status, Sub-merchant and created date", async () => {
    mswServer.use(http.get("/api/v1/admin/sub-merchants/choices", () => HttpResponse.json([
      { id: "11111111-1111-4111-8111-111111111111", code: "MC1-S001", name: "Halo tech", status: "ACTIVE" },
      { id: "44444444-4444-4444-8444-444444444444", code: "MC1-S002", name: "Kho Bắc", status: "ACTIVE" },
    ])));
    renderContainer();
    await screen.findByText("INV-1");
    const filter = screen.getByRole("form", { name: "Bộ lọc tìm kiếm" });
    await chooseOption(filter, /Trạng thái/, /Thành công/);
    await userEvent.click(within(filter).getByRole("button", { name: /Sub-merchant/ }));
    await userEvent.click(await screen.findByRole("checkbox", { name: /Halo tech/ }));
    await userEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    await userEvent.click(within(filter).getByRole("button", { name: "Tìm kiếm" }));
    const url = new URL(String(push.mock.calls.at(-1)?.[0]), "http://localhost");
    expect(url.searchParams.get("status")).toBe("SUCCESS");
    expect(url.searchParams.get("subMerchantIds")).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("labels the order-code box as order code or transaction code", async () => {
    renderContainer();
    await screen.findByText("INV-1");
    expect(screen.getByRole("textbox", { name: "Mã đơn / Mã GD" })).toBeInTheDocument();
  });

  it("shows where the order is going: the Sub-merchant and payment method columns", async () => {
    listReturns([makeOrder({ subMerchantCode: "MC1-S001", subMerchantName: "Halo tech", acceptedPaymentMethod: "DOMESTIC_CARD" })]);
    renderContainer();
    expect(await screen.findByText("Halo tech")).toBeInTheDocument();
    expect(screen.getByText("Thẻ nội địa")).toBeInTheDocument();
  });
});

describe("order detail", () => {
  it("shows a posting order as 'Đang xử lý' without offering a QR", async () => {
    const order = makeOrder({ status: "CREDIT_POSTING", qrCode: "qr" });
    listReturns([order]);
    mswServer.use(http.get(`${base}/${order.id}`, () => HttpResponse.json(order)));
    renderContainer();
    expect(await screen.findByText("Đang xử lý")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
    expect(await screen.findByText(/Hệ thống đang ghi có/)).toBeInTheDocument();
    expect(screen.queryByTitle(/Mã QR đơn INV-1/)).not.toBeInTheDocument();
  });

  it("still shows the retired CREDIT_RECONCILIATION_REQUIRED as 'Đang xử lý' (alias chuyển tiếp)", async () => {
    const order = makeOrder({ status: "CREDIT_RECONCILIATION_REQUIRED" as never, qrCode: "qr" });
    listReturns([order]);
    mswServer.use(http.get(`${base}/${order.id}`, () => HttpResponse.json(order)));
    renderContainer();
    expect(await screen.findByText("Đang xử lý")).toBeInTheDocument();
    expect(screen.queryByText("Cần đối soát")).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
    expect(await screen.findByText(/Hệ thống đang ghi có/)).toBeInTheDocument();
    expect(screen.queryByTitle(/Mã QR đơn INV-1/)).not.toBeInTheDocument();
  });

  it("starts a revenue refund from a paid order, closing the detail first", async () => {
    const order = makeOrder({ status: "SUCCESS" });
    listReturns([order]);
    mswServer.use(http.get(`${base}/${order.id}`, () => HttpResponse.json(order)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Hoàn tiền" }));
    const dialog = await screen.findByRole("dialog", { name: "Tạo yêu cầu hoàn tiền" });
    expect(dialog).toHaveTextContent("Đơn hàng INV-1");
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("shows the QR with its countdown for an unpaid order", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
    expect(await screen.findByTitle(/Mã QR đơn INV-1/)).toBeInTheDocument();
    expect(screen.getByText(/Mã QR còn hiệu lực/)).toBeInTheDocument();
  });
});

describe("refund and dispute entries", () => {
  const paid = makeOrder({ status: "SUCCESS", transactionCode: "FM26NEFQ9", paidAt: "2026-11-02T14:17:54", feeAmount: 30000, netAmount: 120000 });
  const openDetail = async () => {
    mswServer.use(http.get(`${base}/${paid.id}`, () => HttpResponse.json(paid)));
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
  };

  it("offers Hoàn tiền on the row of a paid order and opens the refund form", async () => {
    listReturns([paid]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hoàn tiền đơn INV-1/ }));
    const dialog = await screen.findByRole("dialog", { name: "Tạo yêu cầu hoàn tiền" });
    expect(dialog).toHaveTextContent("Đơn hàng INV-1");
  });

  it("hides the row refund for an unpaid order or without CREATE_REFUND", async () => {
    renderContainer();
    await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ });
    expect(screen.queryByRole("button", { name: /Hoàn tiền đơn INV-1/ })).not.toBeInTheDocument();
    cleanup();
    listReturns([paid]);
    renderContainer({ abilities: { ...abilities, canRefund: false } });
    await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ });
    expect(screen.queryByRole("button", { name: /Hoàn tiền đơn INV-1/ })).not.toBeInTheDocument();
  });

  it("shows the payment time, fee and net amount, with a dash when not paid", async () => {
    listReturns([paid, makeOrder({ id: "44444444-4444-4444-8444-444444444444", orderCode: "INV-2" })]);
    renderContainer();
    expect(await screen.findByText("Thời gian thanh toán")).toBeInTheDocument();
    await openDetail();
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Thời gian thanh toán")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("30.000");
    expect(dialog).toHaveTextContent("120.000");
  });

  it("shows Tra soát in the detail only with CREATE_DISPUTE and a transaction code", async () => {
    listReturns([paid]);
    renderContainer();
    await openDetail();
    await userEvent.click(await screen.findByRole("button", { name: "Tra soát" }));
    expect(await screen.findByRole("dialog", { name: "Khởi tạo yêu cầu Tra soát" })).toBeInTheDocument();
  });

  it("hides Tra soát without CREATE_DISPUTE or when the order has no transaction code", async () => {
    listReturns([paid]);
    renderContainer({ abilities: { ...abilities, canDispute: false } });
    await openDetail();
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Tra soát" })).not.toBeInTheDocument();
    cleanup();
    const noCode = { ...paid, transactionCode: null };
    listReturns([noCode]);
    mswServer.use(http.get(`${base}/${noCode.id}`, () => HttpResponse.json(noCode)));
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("button", { name: "Tra soát" })).not.toBeInTheDocument();
  });
});

describe("complaint entry on the row", () => {
  const paid = makeOrder({ status: "SUCCESS", transactionCode: "FM26NEFQ9", paidAt: "2026-11-02T14:17:54" });
  it("shows the transaction code under the order code and a Khiếu nại button on a paid order", async () => {
    listReturns([paid]);
    renderContainer();
    const row = await screen.findByRole("button", { name: /Khiếu nại đơn INV-1/ });
    expect(row).toBeEnabled();
    expect(screen.getByText(paid.transactionCode!)).toBeInTheDocument();
    await userEvent.click(row);
    const dialog = await screen.findByRole("dialog", { name: "Khởi tạo yêu cầu Tra soát" });
    // Mã cố định lấy từ đơn: đúng nhãn "Mã giao dịch", kèm mã đơn hàng để đối chiếu.
    expect(dialog).toHaveTextContent(`Mã giao dịch: ${paid.transactionCode}`);
    expect(dialog).toHaveTextContent("Mã đơn hàng: INV-1");
  });

  it("hides it for an unpaid order, an order without a transaction code, and without CREATE_DISPUTE", async () => {
    listReturns([makeOrder({ status: "ACTIVE", transactionCode: null })]);
    renderContainer();
    await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ });
    expect(screen.queryByRole("button", { name: /Khiếu nại đơn/ })).not.toBeInTheDocument();
    cleanup();
    listReturns([{ ...paid, transactionCode: null }]);
    renderContainer();
    await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ });
    expect(screen.queryByRole("button", { name: /Khiếu nại đơn/ })).not.toBeInTheDocument();
    cleanup();
    listReturns([paid]);
    renderContainer({ abilities: { ...abilities, canDispute: false } });
    await screen.findByRole("button", { name: /Xem chi tiết đơn INV-1/ });
    expect(screen.queryByRole("button", { name: /Khiếu nại đơn/ })).not.toBeInTheDocument();
  });
});

describe("cancel order", () => {
  const openCancel = async () => {
    await userEvent.click(await screen.findByRole("button", { name: /Hủy đơn INV-1/ }));
    return screen.findByRole("dialog");
  };

  it("offers the action only for an ACTIVE order and a session with CANCEL_ORDER", async () => {
    listReturns([makeOrder({ status: "SUCCESS" })]);
    const paid = renderContainer();
    await screen.findByText("INV-1");
    expect(screen.queryByRole("button", { name: /Hủy đơn INV-1/ })).not.toBeInTheDocument();
    paid.unmount();
    listReturns([activeOrder]);
    renderContainer({ abilities: { ...abilities, canCancel: false } });
    await screen.findByText("INV-1");
    expect(screen.queryByRole("button", { name: /Hủy đơn INV-1/ })).not.toBeInTheDocument();
  });

  it("confirms, posts the cancel and closes the dialog", async () => {
    const cancelled = vi.fn();
    mswServer.use(http.post(`${base}/${activeOrder.id}/cancel`, () => {
      cancelled();
      return HttpResponse.json({ ...activeOrder, status: "CANCELLED", qrCode: null });
    }));
    renderContainer();
    const dialog = await openCancel();
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy đơn" }));
    await waitFor(() => expect(cancelled).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open with the possibly-paid warning when the bank refuses", async () => {
    mswServer.use(http.post(`${base}/${activeOrder.id}/cancel`, () =>
      HttpResponse.json({ message: "Đơn hàng có thể đã được thanh toán", code: "BANK_CANCEL_REJECTED" }, { status: 409 }),
    ));
    renderContainer();
    const dialog = await openCancel();
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy đơn" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("đã được thanh toán");
    expect(await within(dialog).findByRole("button", { name: "Thử hủy lại" })).toBeInTheDocument();
  });
});
