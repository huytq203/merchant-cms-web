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
