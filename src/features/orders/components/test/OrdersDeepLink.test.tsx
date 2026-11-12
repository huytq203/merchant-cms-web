// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { OrdersContainer } from "../OrdersContainer";
import type { Order } from "../../types/types";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/order",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const base = "/api/v1/admin/orders";
const orderId = "33333333-3333-4333-8333-333333333333";
const order: Order = { id: orderId, merchantId: "22222222-2222-4222-8222-222222222222", orderCode: "INV-DEEP", amount: 150000, currency: "VND", status: "SUCCESS", bankCode: "VCB" };
const abilities = { canCreate: false, canCancel: false, canRefund: false, canViewRefunds: false, canDispute: false };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <OrdersContainer filter={{ page: 1, pageSize: 10 }} abilities={abilities} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  replace.mockClear();
  mswServer.use(http.get(base, () => HttpResponse.json({ rows: [order], total: 1 })));
});
afterEach(cleanup);

describe("orders ?detail=", () => {
  it("opens the detail dialog of the order in the URL and removes detail when closed", async () => {
    search = `status=SUCCESS&detail=${orderId}`;
    mswServer.use(http.get(`${base}/${orderId}`, () => HttpResponse.json(order)));
    renderPage();
    expect(await screen.findByText("Chi tiết đơn hàng")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Đóng" }).at(-1)!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/order?status=SUCCESS"));
  });

  it("shows the unavailable message on 404 and keeps the list working", async () => {
    search = `detail=${orderId}`;
    mswServer.use(http.get(`${base}/${orderId}`, () => HttpResponse.json({ message: "not found" }, { status: 404 })));
    renderPage();
    expect(await screen.findByText("Bạn không có quyền xem hoặc mục này không còn tồn tại")).toBeInTheDocument();
    expect(await screen.findByText("INV-DEEP")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Đóng" })[0]!);
    expect(replace).toHaveBeenCalledWith("/order");
  });

  it("ignores a detail value that is not a UUID", async () => {
    search = "detail=abc";
    renderPage();
    expect(await screen.findByText("INV-DEEP")).toBeInTheDocument();
    expect(screen.queryByText("Chi tiết đơn hàng")).not.toBeInTheDocument();
  });
});
