// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { orderDetailSchema } from "../../schemas/disbursement.schema";
import { BATCH_ID, orderDetailFixture, RETRY_ORDER_ID } from "../../test/fixtures";
import type { OrderDetail } from "../../types/types";
import { DisbursementDetail } from "../DisbursementDetail";

const show = (patch: Partial<OrderDetail> = {}) =>
  render(<DisbursementDetail detail={{ ...orderDetailFixture, ...patch }} subLabel="SUB001 · Cửa hàng A" />);

afterEach(cleanup);

describe("DisbursementDetail", () => {
  it("shows the full fee breakdown, the bank reference and the milestones", () => {
    show();
    const fee = screen.getByRole("region", { name: "Tiền và phí" });
    expect(within(fee).getByText("Phí MC trước VAT").nextSibling).toHaveTextContent("3.000");
    expect(within(fee).getByText("VAT").nextSibling).toHaveTextContent("300");
    expect(within(fee).getByText("Giảm phí").nextSibling).toHaveTextContent("0");
    expect(within(fee).getByText("Phí MC sau VAT").nextSibling).toHaveTextContent("3.300");
    expect(within(fee).getByText("Phí người nhận").nextSibling).toHaveTextContent("0");
    expect(within(fee).getByText("Ghi nợ Merchant").nextSibling).toHaveTextContent("5.003.300");
    expect(within(fee).getByText("Thực chi").nextSibling).toHaveTextContent("5.000.000");
    expect(screen.getByText("FT2611180012")).toBeInTheDocument();
    const timeline = screen.getByRole("region", { name: "Dòng thời gian" });
    expect(within(timeline).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Chờ duyệt"),
      expect.stringContaining("Đang xử lý"),
      expect.stringContaining("Thành công"),
    ]);
  });

  it("accountMaskedInListAndDetail: the masked account is all the Portal ever has", () => {
    show();
    expect(screen.getByText(/\*\*\*\*7890/)).toBeInTheDocument();
    expect(screen.getByText("NGUYEN VAN KIEN")).toBeInTheDocument();
  });

  it("detailShowsRejectReasonAndBankRef: a cancelled order shows the reason the admin wrote for the Merchant", () => {
    show({ status: "CANCELLED", statusLabel: "Đã hủy", bankReference: null, merchantReason: "Thông tin người nhận chưa chính xác", completedAt: null });
    expect(screen.getByText("Lý do")).toBeInTheDocument();
    expect(screen.getByText("Thông tin người nhận chưa chính xác")).toBeInTheDocument();
    // Không có Ref ngân hàng thì nói rõ chứ không để ô trống.
    expect(screen.getByText("Mã tham chiếu ngân hàng").nextSibling).toHaveTextContent("—");
  });

  it("shows the failure reason of a failed order in Vietnamese, keeping the code for tracing", () => {
    show({ status: "FAILED", statusLabel: "Thất bại", failureCode: "BANK_REJECTED", bankReference: null, merchantReason: "Tài khoản nhận đã đóng" });
    expect(screen.getByText("Tài khoản nhận đã đóng")).toBeInTheDocument();
    expect(screen.getByText("Lý do thất bại")).toBeInTheDocument();
    expect(screen.getByText("Ngân hàng từ chối giao dịch")).toBeInTheDocument();
    expect(screen.getByText(/BANK_REJECTED/)).toBeInTheDocument();
  });

  it("translates a ledger refusal code instead of printing the raw code alone (chốt 20/11)", () => {
    show({ status: "FAILED", statusLabel: "Thất bại", failureCode: "DAILY_AMOUNT_LIMIT", bankReference: null, merchantReason: null });
    expect(screen.getByText("Vượt hạn mức chi hộ trong ngày")).toBeInTheDocument();
  });

  it("an unknown failure code still reads as a sentence with the code", () => {
    show({ status: "FAILED", statusLabel: "Thất bại", failureCode: "BRAND_NEW_CODE", bankReference: null, merchantReason: null });
    expect(screen.getByText("Giao dịch thất bại (mã: BRAND_NEW_CODE)")).toBeInTheDocument();
  });

  it("detailHidesInternalFields: nothing outside the Portal contract reaches the screen, even if BE sent it", () => {
    // BE đã bỏ các trường này; nếu lỡ gửi, schema phải cắt trước khi tới giao diện.
    const leaked = orderDetailSchema.parse({
      ...orderDetailFixture,
      approvedBy: "admin.kt@flexpay.vn",
      ledgerJournalId: "journal-123",
      reserveAmount: 777_000,
      evidenceId: "evidence-9",
      lastError: "java.net.SocketTimeoutException",
    });
    render(<DisbursementDetail detail={leaked} subLabel="SUB001 · Cửa hàng A" />);
    const text = document.body.textContent ?? "";
    for (const secret of ["admin.kt@flexpay.vn", "journal-123", "777.000", "evidence-9", "SocketTimeout"]) {
      expect(text).not.toContain(secret);
    }
  });

  it("postfundedShowsFundingSourceNotTheInternalReserve", () => {
    show({ fundingSource: "POSTFUNDED" });
    expect(screen.getByText("Nguồn tiền").nextSibling).toHaveTextContent("Trả sau");
    expect(screen.queryByText(/dự phòng/i)).not.toBeInTheDocument();
  });

  it("returnsAndRetryLinksShown: links the retried order, the original order and the batch, and lists returns", () => {
    show({
      batchId: BATCH_ID,
      retriedByOperationId: RETRY_ORDER_ID,
      retryOfOperationId: "99999999-9999-4999-8999-999999999999",
      hasReturn: true,
      returns: [{ returnCode: "NHT0001", principal: 5_000_000, feeRefund: 3_300, returnedAt: "2026-11-19T03:00:00+07:00", statusLabel: "Đã hoàn trả" }],
    });
    expect(screen.getByRole("link", { name: /Lệnh chi lại/ })).toHaveAttribute("href", `/disbursements/orders/${RETRY_ORDER_ID}`);
    expect(screen.getByRole("link", { name: /Lệnh gốc/ })).toHaveAttribute("href", "/disbursements/orders/99999999-9999-4999-8999-999999999999");
    expect(screen.getByRole("link", { name: /Lô chi hộ/ })).toHaveAttribute("href", `/disbursements/batches/${BATCH_ID}`);
    const returns = screen.getByRole("region", { name: "Hoàn trả" });
    expect(within(returns).getByText("NHT0001")).toBeInTheDocument();
    expect(within(returns).getByText("Đã hoàn trả")).toBeInTheDocument();
  });

  it("has no return section and no retry links for a plain order", () => {
    show();
    expect(screen.queryByRole("region", { name: "Hoàn trả" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Lệnh chi lại/ })).not.toBeInTheDocument();
  });

  it("detailShowsPayoutOnlyWhenSucceeded: a refused or failed order never shows a payout figure", () => {
    for (const status of ["CANCELLED", "FAILED", "PENDING_APPROVAL", "PROCESSING"]) {
      cleanup();
      show({ status });
      const fee = screen.getByRole("region", { name: "Tiền và phí" });
      expect(within(fee).getByText("Thực chi").nextSibling).toHaveTextContent("—");
      expect(within(fee).getByText("Thực chi").nextSibling).not.toHaveTextContent("5.000.000");
    }
    cleanup();
    show({ status: "SUCCEEDED" });
    expect(within(screen.getByRole("region", { name: "Tiền và phí" })).getByText("Thực chi").nextSibling).toHaveTextContent("5.000.000");
  });

  it("does not warn about duplicate timeline keys when BE sends two milestones of the same status", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    show({ timeline: [
      { status: "PROCESSING", label: "Đang xử lý", at: "2026-11-18T09:30:20+07:00" },
      { status: "PROCESSING", label: "Đang xử lý", at: "2026-11-18T09:35:20+07:00" },
    ] });
    expect(screen.getAllByText("Đang xử lý")).toHaveLength(2);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("retriesListed: lists every retry attempt with its status and links, oldest first", () => {
    show({
      retries: [
        { operationId: RETRY_ORDER_ID, attempt: 1, status: "FAILED", statusLabel: "Thất bại", createdAt: "2026-11-19T09:00:00+07:00" },
        { operationId: "88888888-8888-4888-8888-888888888888", attempt: 2, status: "SUCCEEDED", statusLabel: "Thành công", createdAt: "2026-11-20T09:00:00+07:00" },
      ],
      retriedByOperationId: "88888888-8888-4888-8888-888888888888",
    });
    const region = screen.getByRole("region", { name: "Các lần chi lại" });
    const items = within(region).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Lần chi lại 1");
    expect(items[0]).toHaveTextContent("Thất bại");
    expect(within(items[0]!).getByRole("link")).toHaveAttribute("href", `/disbursements/orders/${RETRY_ORDER_ID}`);
    expect(items[1]).toHaveTextContent("Lần chi lại 2");
    expect(items[1]).toHaveTextContent("Thành công");
    // Danh sách đã chứa lệnh mới nhất nên không lặp thêm liên kết đơn "Lệnh chi lại của lệnh này".
    expect(screen.queryByRole("link", { name: /Lệnh chi lại của lệnh này/ })).not.toBeInTheDocument();
  });

  it("retriesFallsBackToTheSingleLinkOnAnOlderBackend", () => {
    show({ retriedByOperationId: RETRY_ORDER_ID });
    expect(screen.queryByRole("region", { name: "Các lần chi lại" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lệnh chi lại/ })).toHaveAttribute("href", `/disbursements/orders/${RETRY_ORDER_ID}`);
  });

  it("a retry order says which attempt it is", () => {
    show({ retryOfOperationId: "99999999-9999-4999-8999-999999999999", retryAttempt: 2 });
    expect(screen.getByRole("link", { name: /Lệnh gốc/ })).toHaveTextContent("lần chi lại thứ 2");
  });

  it("retries are read from the BE view and a missing list reads as empty", () => {
    const withList = orderDetailSchema.parse({
      ...orderDetailFixture,
      retryAttempt: null,
      retries: [{ operationId: RETRY_ORDER_ID, attempt: 1, status: "PROCESSING", statusLabel: "Đang xử lý", createdAt: null }],
    });
    expect(withList.retries).toHaveLength(1);
    expect(orderDetailSchema.parse(orderDetailFixture).retries).toEqual([]);
  });

  it("keeps working when the fee block is missing (older BE)", () => {
    show({ fee: null, timeline: [] });
    expect(screen.getByText("Chưa có thông tin phí")).toBeInTheDocument();
  });
});
