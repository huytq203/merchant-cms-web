// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { challengeFixture, pendingId, pendingRefund, processingRefund, queuedRefund, subId, succeededRefund } from "../../test/fixtures";
import type { RefundFilter } from "../../types";
import { RevenueRefundsContainer } from "../RevenueRefundsContainer";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/revenue-refunds", useSearchParams: () => new URLSearchParams() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base = "/api/v1/admin/revenue-refunds";
const rows = [pendingRefund, processingRefund, succeededRefund, queuedRefund];
const summary = { total: 5, pending: 1, processing: 2, succeeded: 1, failed: 0, cancelled: 1, succeededAmount: 40_000 };
let listQuery: URL | undefined;

function renderContainer(canApprove = true, canCreate = false, filter: RefundFilter = {}, access: { canCancelAny?: boolean; userId?: string } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <RevenueRefundsContainer filter={filter} today="2026-11-10" canApprove={canApprove} canCreate={canCreate} canCancelAny={access.canCancelAny ?? canApprove} userId={access.userId} subNames={{ [subId]: "SUB001 · Cửa hàng A" }} />
    </QueryClientProvider>,
  );
}

async function typeCode(code: string) {
  await userEvent.click(screen.getByRole("textbox", { name: "Digit 1 of 6" }));
  await userEvent.keyboard(code);
}

beforeEach(() => {
  listQuery = undefined;
  mswServer.use(
    http.get(base, ({ request }) => {
      listQuery = new URL(request.url);
      return HttpResponse.json({ rows });
    }),
    http.get(`${base}/summary`, () => HttpResponse.json(summary)),
  );
});
afterEach(() => {
  cleanup();
  push.mockClear();
});

describe("revenue refunds container", () => {
  it("shows loading, then each status with what it means for the merchant", async () => {
    renderContainer();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Chờ phê duyệt")).toBeInTheDocument();
    expect(within(table).getByText("Chờ kế toán xử lý")).toBeInTheDocument();
    expect(within(table).getByText(/chưa trừ tiền/i)).toBeInTheDocument();
    expect(within(table).getByText("Chờ chuyển tiền")).toBeInTheDocument();
  });

  it("explains an empty list", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [] })));
    renderContainer();
    expect(await screen.findByText(/Chưa có yêu cầu hoàn tiền nào/)).toBeInTheDocument();
  });

  it("only offers approval on a pending request, and not at all without APPROVE_REFUND", async () => {
    const view = renderContainer();
    await screen.findByRole("table");
    expect(screen.getByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Phê duyệt MRF55D0A9B1C2E3F4A07" })).toBeDisabled();
    view.unmount();
    renderContainer(false);
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Phê duyệt/ })).not.toBeInTheDocument();
  });

  it("approves after showing the consequence and taking the emailed code", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${base}/${pendingId}/otp-challenge`, () => HttpResponse.json(challengeFixture)),
      http.post(`${base}/${pendingId}/approve`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ ...pendingRefund, status: "PROCESSING" });
      }),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("SUB001 · Cửa hàng A");
    expect(dialog).toHaveTextContent("120.000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi mã OTP" }));
    await typeCode("123456");
    await userEvent.click(within(dialog).getByRole("button", { name: "Phê duyệt" }));
    await waitFor(() => expect(body).toEqual({ sensitiveOtp: { otpSessionId: "otp-1", otp: "123456" } }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("keeps the dialog open and shows a wrong code", async () => {
    mswServer.use(
      http.post(`${base}/${pendingId}/otp-challenge`, () => HttpResponse.json(challengeFixture)),
      http.post(`${base}/${pendingId}/approve`, () => HttpResponse.json(
        { message: "Mã OTP không đúng hoặc đã hết hạn", code: "MERCHANT_SENSITIVE_OTP_INVALID" }, { status: 400 },
      )),
    );
    renderContainer();
    await userEvent.click(await screen.findByRole("button", { name: "Phê duyệt MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Gửi mã OTP" }));
    await typeCode("000000");
    await userEvent.click(within(dialog).getByRole("button", { name: "Phê duyệt" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Mã OTP không đúng hoặc đã hết hạn");
  });

  it("shows the status-group counts and the successful refunded total", async () => {
    renderContainer();
    await screen.findByRole("table");
    await waitFor(() => expect(screen.getByTestId("refund-count-PROCESSING")).toHaveTextContent("2"));
    expect(screen.getByTestId("refund-count-PENDING")).toHaveTextContent("1");
    expect(screen.getByTestId("refund-count-SUCCEEDED")).toHaveTextContent("1");
    expect(screen.getByTestId("refund-count-FAILED")).toHaveTextContent("0");
    expect(screen.getByTestId("refund-count-CANCELLED")).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /Đã hủy/ })).toBeInTheDocument();
    expect(screen.getByTestId("refund-succeeded-amount")).toHaveTextContent("40.000");
  });

  it("asks the BE for the last 7 days by default, with the dates of that period", async () => {
    renderContainer();
    await screen.findByRole("table");
    expect(listQuery?.searchParams.get("from")).toBe("2026-11-04");
    expect(listQuery?.searchParams.get("to")).toBe("2026-11-10");
  });

  it("does not limit the dates of a link that names an order, but does once a period is written", async () => {
    renderContainer(true, false, { orderId: "7c1f2a3e-1111-4222-8333-444455556666" });
    await screen.findByRole("table");
    expect(listQuery?.searchParams.get("orderId")).toBe("7c1f2a3e-1111-4222-8333-444455556666");
    expect(listQuery?.searchParams.has("from")).toBe(false);
    expect(listQuery?.searchParams.has("to")).toBe(false);
    cleanup();
    renderContainer(true, false, { orderId: "7c1f2a3e-1111-4222-8333-444455556666", period: "7d" });
    await screen.findByRole("table");
    await waitFor(() => expect(listQuery?.searchParams.get("from")).toBe("2026-11-04"));
  });

  it("filters by status group through the URL and clears it by pressing the same group", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: /Đang xử lý/ }));
    expect(push).toHaveBeenCalledWith("/revenue-refunds?group=PROCESSING");
    cleanup();
    push.mockClear();
    renderContainer(true, false, { group: "PROCESSING" });
    await screen.findByRole("table");
    expect(listQuery?.searchParams.get("statuses")).toBe("PROCESSING,ACCOUNTING_QUEUE");
    await userEvent.click(screen.getByRole("button", { name: /Đang xử lý/ }));
    expect(push).toHaveBeenCalledWith("/revenue-refunds");
  });

  it("searches one code and switches the period through the URL", async () => {
    renderContainer();
    await screen.findByRole("table");
    await userEvent.type(screen.getByLabelText("Mã hoàn tiền / mã giao dịch / mã đơn hàng"), "FM26K3QZP");
    await userEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    await userEvent.click(screen.getByRole("button", { name: "Tìm kiếm" }));
    expect(push).toHaveBeenCalledWith("/revenue-refunds?q=FM26K3QZP&period=30d");
  });

  it("clearing the filter returns to the default 7 days", async () => {
    renderContainer(true, false, { period: "30d", q: "DH26" });
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: /Xóa/ }));
    expect(push).toHaveBeenCalledWith("/revenue-refunds");
  });

  it("labels the code columns with the agreed terms and shows both codes of the order", async () => {
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...pendingRefund, orderCode: "DH261110-6965", transactionCode: "FM26M7Q2A", subMerchantName: "Halo tech", terminalCode: "TML000001" }] })));
    renderContainer();
    const table = await screen.findByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Mã hoàn tiền" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "Mã đơn hàng" })).toBeInTheDocument();
    expect(within(table).getByText("DH261110-6965")).toBeInTheDocument();
    expect(within(table).getByText("FM26M7Q2A")).toBeInTheDocument();
    expect(within(table).getByText("Halo tech")).toBeInTheDocument();
    expect(within(table).getByText("TML000001")).toBeInTheDocument();
  });

  it("downloads the CSV of the current filter", async () => {
    let exported: URL | null = null;
    mswServer.use(http.get(`${base}/export`, ({ request }) => {
      exported = new URL(request.url);
      return new HttpResponse("\uFEFFa\n", { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=\"hoan-tien.csv\"" } });
    }));
    const createObjectURL = vi.fn(() => "blob:rf");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    renderContainer(true, false, { group: "SUCCEEDED", q: "DH26" });
    await userEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Xuất Excel" }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(Object.fromEntries(exported!.searchParams)).toEqual({ q: "DH26", statuses: "SUCCEEDED", from: "2026-11-04", to: "2026-11-10" });
    expect(createObjectURL).toHaveBeenCalled();
    click.mockRestore();
  });

  it("offers Hủy only on a pending request and only to someone who can create or approve", async () => {
    const view = renderContainer(true);
    await screen.findByRole("table");
    expect(screen.getByRole("button", { name: "Hủy yêu cầu MRF7A21C3D8E4B90F11" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Hủy yêu cầu MRF55D0A9B1C2E3F4A07" })).not.toBeInTheDocument();
    view.unmount();
    renderContainer(false, false);
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Hủy yêu cầu/ })).not.toBeInTheDocument();
  });

  it("shows Hủy by the BE rule: own request with CREATE_REFUND, anyone's with CANCEL_REFUND, never an Admin-created one", async () => {
    // Người chỉ có CREATE_REFUND: chỉ yêu cầu của chính mình.
    let view = renderContainer(false, true, {}, { userId: "someone-else" });
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Hủy yêu cầu MRF/ })).not.toBeInTheDocument();
    view.unmount();
    view = renderContainer(false, true, {}, { userId: "user-creator" });
    expect(await screen.findByRole("button", { name: "Hủy yêu cầu MRF7A21C3D8E4B90F11" })).toBeEnabled();
    view.unmount();
    // CANCEL_REFUND (không phải người tạo) hủy được.
    view = renderContainer(false, false, {}, { canCancelAny: true, userId: "someone-else" });
    expect(await screen.findByRole("button", { name: "Hủy yêu cầu MRF7A21C3D8E4B90F11" })).toBeEnabled();
    view.unmount();
    // Yêu cầu do Admin tạo: không ai ở Portal hủy được.
    mswServer.use(http.get(base, () => HttpResponse.json({ rows: [{ ...pendingRefund, createdSource: "ADMIN" }] })));
    renderContainer(true, true, {}, { canCancelAny: true, userId: "user-creator" });
    await screen.findByRole("table");
    expect(screen.queryByRole("button", { name: /Hủy yêu cầu MRF/ })).not.toBeInTheDocument();
  });

  it("cancels after an in-page confirmation, without the browser confirm()", async () => {
    const confirm = vi.spyOn(window, "confirm");
    let called = false;
    mswServer.use(http.post(`${base}/${pendingId}/cancel`, () => {
      called = true;
      return HttpResponse.json({ ...pendingRefund, status: "CANCELLED" });
    }));
    renderContainer(false, true, {}, { userId: "user-creator" });
    await userEvent.click(await screen.findByRole("button", { name: "Hủy yêu cầu MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Hủy yêu cầu hoàn tiền");
    expect(called).toBe(false);
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy yêu cầu" }));
    await waitFor(() => expect(called).toBe(true));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(confirm).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the BE sentence when the cancel is refused", async () => {
    mswServer.use(http.post(`${base}/${pendingId}/cancel`, () => HttpResponse.json(
      { message: "Chỉ hủy được yêu cầu đang chờ phê duyệt", code: "MERCHANT_REFUND_STATE_INVALID" }, { status: 409 },
    )));
    renderContainer(false, true, {}, { userId: "user-creator" });
    await userEvent.click(await screen.findByRole("button", { name: "Hủy yêu cầu MRF7A21C3D8E4B90F11" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy yêu cầu" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Chỉ hủy được yêu cầu đang chờ phê duyệt");
  });
});
