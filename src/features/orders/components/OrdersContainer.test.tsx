// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { OrdersContainer } from "./OrdersContainer";
import type { Order, OrderListFilter } from "../types/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/order" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/orders";
const merchantId = "22222222-2222-4222-8222-222222222222";
const filter: OrderListFilter = { page: 1, pageSize: 10 };
const abilities = { canCreate: true };
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
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

async function chooseOption(dialog: HTMLElement, index: number, name: RegExp) {
  await userEvent.click(within(dialog).getAllByRole("combobox")[index]!);
  await userEvent.click(await screen.findByRole("option", { name }));
}

async function fillValidForm() {
  const dialog = await screen.findByRole("dialog");
  await chooseOption(dialog, 1, /Vietcombank/);
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Mã đơn hàng/ }), "INV-9");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Số tiền/ }), "250000");
  return dialog;
}

describe("orders container states", () => {
  it("shows loading, error, empty and data states", async () => {
    mswServer.use(http.get(base, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByText("Đang tải danh sách đơn hàng...")).toBeInTheDocument();
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
    renderContainer({ abilities: { canCreate: false } });
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
