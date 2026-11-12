// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { subId, succeededRefund } from "../../test/fixtures";
import { RevenueRefundsContainer } from "../RevenueRefundsContainer";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/revenue-refunds",
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base = "/api/v1/admin/revenue-refunds";
const summary = { total: 1, pending: 0, processing: 0, succeeded: 1, failed: 0, cancelled: 0, succeededAmount: 40_000 };

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RevenueRefundsContainer filter={{}} today="2026-11-10" canApprove={false} subNames={{ [subId]: "SUB001 · Cửa hàng A" }} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  replace.mockClear();
  mswServer.use(
    http.get(base, () => HttpResponse.json({ rows: [succeededRefund] })),
    http.get(`${base}/summary`, () => HttpResponse.json(summary)),
  );
});
afterEach(cleanup);

describe("revenue refunds ?detail=", () => {
  it("opens the refund detail modal and removes detail when closed", async () => {
    search = `group=SUCCEEDED&detail=${succeededRefund.id}`;
    mswServer.use(http.get(`${base}/${succeededRefund.id}`, () => HttpResponse.json({ ...succeededRefund, approvedBy: "An" })));
    renderPage();
    expect(await screen.findByText("Chi tiết hoàn tiền")).toBeInTheDocument();
    expect(await screen.findByText("An")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "Đóng" }).at(-1)!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/revenue-refunds?group=SUCCEEDED"));
  });

  it("shows the unavailable message on 404 while the list keeps working", async () => {
    search = `detail=${succeededRefund.id}`;
    mswServer.use(http.get(`${base}/${succeededRefund.id}`, () => HttpResponse.json({ message: "Không tìm thấy lệnh hoàn tiền." }, { status: 404 })));
    renderPage();
    expect(await screen.findByText("Bạn không có quyền xem hoặc mục này không còn tồn tại")).toBeInTheDocument();
    expect(await screen.findByText(succeededRefund.refundCode)).toBeInTheDocument();
  });
});
