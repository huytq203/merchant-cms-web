// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import type { Order } from "@/features/orders/types/types";
import { RevenueRefundsContainer } from "../RevenueRefundsContainer";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/revenue-refunds" }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

// Bộ chọn lấy đơn hàng thanh toán thành công từ danh sách đơn hàng (không còn màn Giao dịch).
const ordersPath = "/api/v1/admin/orders";
const SUCCESS_ORDER: Order = {
  id: "7f65f7e7-3d1b-40ad-a047-d775acd45394",
  merchantId: "eb8e7b15-5e65-4b71-b69e-2b8561f91f24",
  orderCode: "DH261102-2208",
  transactionCode: "FM26NEFQ9",
  subMerchantName: "Halo Láng",
  amount: 1500000,
  currency: "VND",
  status: "SUCCESS",
};
const requests: URL[] = [];

function renderContainer(canCreate: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RevenueRefundsContainer filter={{}} canApprove={false} canCreate={canCreate} subNames={{}} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  requests.length = 0;
  mswServer.use(
    http.get("/api/v1/admin/revenue-refunds", () => HttpResponse.json({ rows: [] })),
    http.get(ordersPath, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({ rows: [SUCCESS_ORDER], total: 1 });
    }),
  );
});
afterEach(() => cleanup());

describe("creating a refund from the revenue refunds page", () => {
  it("is offered only to a session with CREATE_REFUND", async () => {
    const view = renderContainer(false);
    await screen.findByText(/Chưa có yêu cầu hoàn tiền nào/);
    expect(screen.queryByRole("button", { name: /Tạo yêu cầu hoàn tiền/ })).not.toBeInTheDocument();
    view.unmount();

    renderContainer(true);
    expect(await screen.findByRole("button", { name: /Tạo yêu cầu hoàn tiền/ })).toBeInTheDocument();
  });

  it("lists only successful orders, searches them and opens the refund form for the chosen one", async () => {
    renderContainer(true);
    await userEvent.click(await screen.findByRole("button", { name: /Tạo yêu cầu hoàn tiền/ }));

    const picker = await screen.findByRole("dialog", { name: "Chọn đơn hàng cần hoàn tiền" });
    expect(await within(picker).findByText("DH261102-2208")).toBeInTheDocument();
    expect(within(picker).getByText("FM26NEFQ9")).toBeInTheDocument();
    expect(requests[0]!.searchParams.get("status")).toBe("SUCCESS");

    await userEvent.type(within(picker).getByRole("textbox", { name: /Tìm đơn hàng/ }), "2208");
    await userEvent.click(within(picker).getByRole("button", { name: "Tìm" }));
    await vi.waitFor(() => expect(requests.at(-1)!.searchParams.get("orderCode")).toBe("2208"));
    expect(requests.at(-1)!.searchParams.get("status")).toBe("SUCCESS");

    await userEvent.click(within(picker).getByRole("button", { name: "Chọn đơn hàng DH261102-2208" }));

    const form = await screen.findByRole("dialog", { name: "Tạo yêu cầu hoàn tiền" });
    expect(form).toHaveTextContent("Giao dịch DH261102-2208");
  });
});
