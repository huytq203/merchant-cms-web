// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { mswServer } from "@/test/msw";
import { WithdrawalDetailModal } from "../WithdrawalDetailModal";
import type { Withdrawal } from "../../types/types";

/**
 * Chưa chắc môi trường thật có trả mã tham chiếu ngân hàng (05/11): dòng "Mã tham chiếu ngân hàng"
 * chỉ hiện khi có mã, không hiện "Chưa có".
 */
const makeWithdrawal = (bankRefId: string | null): Withdrawal => ({
  id: "33333333-3333-4333-8333-333333333333",
  merchantId: "22222222-2222-4222-8222-222222222222",
  transactionCode: "WD2601",
  requestType: "MANUAL",
  amount: 5_000_000,
  fee: 5_500,
  currency: "VND",
  bankCode: "VCB",
  bankAccountMasked: "xxxx1789",
  bankAccountName: "CONG TY A",
  status: "COMPLETED",
  bankRefId,
  reason: null,
  createdAt: "2026-01-13T09:30:00",
  updatedAt: null,
  setoffAmount: 0,
  netReceived: 4_994_500,
  payoutFeeMode: "DEDUCT",
});

function renderModal(withdrawal: Withdrawal) {
  // Bản ghi chi tiết trả về giống dòng danh sách để modal không đổi nội dung giữa chừng.
  mswServer.use(http.get(`/api/v1/admin/withdrawals/${withdrawal.id}`, () => HttpResponse.json(withdrawal)));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <WithdrawalDetailModal open onOpenChange={() => {}} listed={withdrawal} />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("WithdrawalDetailModal — số tiền", () => {
  it("lệnh của Sub: phí và cấn trừ nằm trong số rút, hiện thực nhận, không có Tổng trừ ví", async () => {
    renderModal({ ...makeWithdrawal(null), amount: 1_568_000, setoffAmount: 1_000_000, fee: 5_680, netReceived: 562_320 });
    expect(await screen.findByText(/Cấn trừ ký quỹ/)).toBeInTheDocument();
    expect(screen.getByText("1.000.000 vnđ")).toBeInTheDocument();
    expect(screen.getByText("5.680 vnđ")).toBeInTheDocument();
    expect(screen.getByText("562.320 vnđ")).toBeInTheDocument();
    expect(screen.queryByText(/Tổng trừ ví/)).not.toBeInTheDocument();
    expect(screen.queryByText("1.573.680 vnđ")).not.toBeInTheDocument();
  });

  it("lệnh cũ ADD_ON: phí cộng thêm nên vẫn hiện Tổng trừ ví", async () => {
    renderModal({ ...makeWithdrawal(null), payoutFeeMode: "ADD_ON", netReceived: 5_000_000 });
    expect(await screen.findByText(/Tổng trừ ví/)).toBeInTheDocument();
    expect(screen.getByText("5.005.500 vnđ")).toBeInTheDocument();
  });
});

describe("WithdrawalDetailModal — mã tham chiếu ngân hàng", () => {
  it("có mã thì hiện dòng kèm mã", async () => {
    renderModal(makeWithdrawal("FT26305ABC"));
    expect(await screen.findByText("FT26305ABC")).toBeInTheDocument();
    expect(screen.getByText("Mã tham chiếu ngân hàng")).toBeInTheDocument();
  });

  it.each([null, ""])("mã %j thì ẩn cả dòng", async (bankRefId) => {
    renderModal(makeWithdrawal(bankRefId));
    expect(await screen.findByText("Chủ tài khoản")).toBeInTheDocument();
    expect(screen.queryByText("Mã tham chiếu ngân hàng")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có")).not.toBeInTheDocument();
  });
});
