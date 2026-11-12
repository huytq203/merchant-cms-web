// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { succeededRefund } from "../../test/fixtures";
import { RefundDetailModal } from "../RefundDetailModal";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/revenue-refunds", useSearchParams: () => new URLSearchParams() }));

const url = `/api/v1/admin/revenue-refunds/${succeededRefund.id}`;
const detail = {
  ...succeededRefund,
  orderCode: "DH2611",
  approvedBy: "Nguyễn Văn An",
  approvedAt: "2026-10-13T03:00:00Z",
  decisionNote: "Đã đối chiếu với khách",
  payoutAt: null,
  payoutReference: null,
};

function renderModal(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><RefundDetailModal refundId={succeededRefund.id} onClose={onClose} /></QueryClientProvider>);
  return onClose;
}

afterEach(cleanup);

describe("RefundDetailModal", () => {
  it("shows code, order, amount, status, approver and reason", async () => {
    mswServer.use(http.get(url, () => HttpResponse.json(detail)));
    renderModal();
    expect(await screen.findByText(succeededRefund.refundCode)).toBeTruthy();
    expect(screen.getByText("DH2611")).toBeTruthy();
    expect(screen.getByText(/40\.000/)).toBeTruthy();
    expect(screen.getByText("Thành công")).toBeTruthy();
    expect(screen.getByText("Nguyễn Văn An")).toBeTruthy();
    expect(screen.getByText("Khách trả hàng")).toBeTruthy();
    expect(screen.getByText("Đã đối chiếu với khách")).toBeTruthy();
  });

  it.each([403, 404])("shows the unavailable message on %i and closes via the button", async (status) => {
    mswServer.use(http.get(url, () => HttpResponse.json({ message: "Không tìm thấy lệnh hoàn tiền." }, { status })));
    const onClose = renderModal();
    expect(await screen.findByText("Bạn không có quyền xem hoặc mục này không còn tồn tại")).toBeTruthy();
    await userEvent.click(screen.getAllByRole("button", { name: "Đóng" })[0]!);
    expect(onClose).toHaveBeenCalled();
  });
});
