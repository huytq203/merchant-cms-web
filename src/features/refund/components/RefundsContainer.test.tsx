// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { toast } from "sonner";
import { mswServer } from "@/test/msw";
import { RefundsContainer } from "./RefundsContainer";
import type { Refund, RefundListFilter } from "../types/type";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/refund" }));
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));

const listPath = "/api/v1/admin/merchants/refunds";
const filter: RefundListFilter = { page: 1, pageSize: 10 };
const pendingRow: Refund = {
  id: "r-1",
  code: "REF-1",
  transactionId: "t-1",
  transactionCode: "TRX-1",
  invoiceCode: null,
  subMerchantId: "SM001",
  subMerchantName: "Cửa hàng mẫu A",
  requestAmount: 90000,
  actualAmount: 89000,
  feeMb: 1000,
  feeNm: 0,
  recipientName: "Người nhận mẫu 001",
  recipientCard: null,
  createdBy: null,
  reason: null,
  status: "pending",
  createdAt: "2026-09-05T02:00:00.000Z",
  updatedAt: null,
};
const successRow: Refund = { ...pendingRow, id: "r-2", code: "REF-2", status: "success" };

function renderContainer(canCancel = true, showSubMerchantFilter = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RefundsContainer filter={filter} abilities={{ canCancel }} showSubMerchantFilter={showSubMerchantFilter} />
    </QueryClientProvider>,
  );
}

function listReturns(rows: Refund[]) {
  mswServer.use(http.get(listPath, () => HttpResponse.json({ rows, total: rows.length })));
}

beforeEach(() => {
  listReturns([pendingRow, successRow]);
  mswServer.use(http.get("/api/v1/admin/sub-merchants", () => HttpResponse.json({ rows: [], total: 0 })));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("refunds container states", () => {
  it("shows loading, unsupported, empty and data states", async () => {
    mswServer.use(http.get(listPath, () => new Promise(() => {})));
    const loading = renderContainer();
    expect(screen.getByRole("status", { busy: true })).toBeInTheDocument();
    loading.unmount();

    mswServer.use(http.get(listPath, () => HttpResponse.json({ message: "x" }, { status: 501 })));
    const unsupported = renderContainer();
    expect(await screen.findByText("Chưa hỗ trợ")).toBeInTheDocument();
    unsupported.unmount();

    listReturns([]);
    const empty = renderContainer();
    expect(await screen.findByText("Không tìm thấy yêu cầu hoàn tiền nào phù hợp")).toBeInTheDocument();
    empty.unmount();

    listReturns([pendingRow]);
    renderContainer();
    expect(await screen.findByText("REF-1")).toBeInTheDocument();
  });
});

describe("refunds container behavior", () => {
  it("offers cancel only for pending refunds the user may cancel", async () => {
    renderContainer();
    await screen.findByText("REF-1");
    expect(screen.getByRole("button", { name: /Hủy yêu cầu hoàn tiền REF-1/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Hủy yêu cầu hoàn tiền REF-2/ })).not.toBeInTheDocument();
    cleanup();
    renderContainer(false);
    await screen.findByText("REF-1");
    expect(screen.queryByRole("button", { name: /Hủy yêu cầu hoàn tiền/ })).not.toBeInTheDocument();
  });

  it("writes the search into the URL starting from the first page", async () => {
    renderContainer();
    await screen.findByText("REF-1");
    await userEvent.type(screen.getByRole("textbox", { name: /Mã hoàn tiền/ }), "REF-9");
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledTimes(1);
    const url = new URL(String(push.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/refund");
    expect(url.searchParams.get("keyword")).toBe("REF-9");
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("opens the cancel confirmation for the chosen refund", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hủy yêu cầu hoàn tiền REF-1/ }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent("REF-1");
  });

  it("says cancelling is unsupported and keeps the confirmation open", async () => {
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Hủy yêu cầu hoàn tiền REF-1/ }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy yêu cầu ngay" }));
    expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/chưa được hỗ trợ/));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("shows only stored history in the detail: no invented actor", async () => {
    listReturns([{ ...successRow, status: "approved", updatedAt: "2026-09-06T03:00:00.000Z" }]);
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: /Xem chi tiết/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByText(/admin_super/)).not.toBeInTheDocument();
    expect(within(dialog).queryByText(/Bởi/)).not.toBeInTheDocument();
  });

  it("offers the sub-merchant filter, and hides it without calling the BE list in fixture mode", async () => {
    const requested = vi.fn();
    mswServer.use(http.get("/api/v1/admin/sub-merchants", () => {
      requested();
      return HttpResponse.json({ rows: [], total: 0 });
    }));
    renderContainer(true, true);
    await screen.findByText("REF-1");
    expect(within(screen.getByRole("region", { name: "Bộ lọc tìm kiếm" })).getByText("Sub-merchant")).toBeInTheDocument();
    cleanup();
    requested.mockClear();
    renderContainer(true, false);
    await screen.findByText("REF-1");
    expect(within(screen.getByRole("region", { name: "Bộ lọc tìm kiếm" })).queryByText("Sub-merchant")).not.toBeInTheDocument();
    expect(requested).not.toHaveBeenCalled();
  });
});
