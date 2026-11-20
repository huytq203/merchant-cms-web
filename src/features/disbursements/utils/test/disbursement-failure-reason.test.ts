import { describe, expect, it } from "vitest";
import { DISBURSEMENT_FAILURE_REASONS, disbursementFailureReason } from "../disbursement-failure-reason";

describe("disbursementFailureReason", () => {
  it("dịch mã từ chối của sổ wallet-core đúng câu của InternalSubDisbursementController", () => {
    expect(disbursementFailureReason("SERVICE_DISABLED")).toBe("Dịch vụ chi hộ đang tắt");
    expect(disbursementFailureReason("PER_TXN_LIMIT")).toBe("Số tiền ngoài hạn mức mỗi lệnh chi hộ");
    expect(disbursementFailureReason("DAILY_AMOUNT_LIMIT")).toBe("Vượt hạn mức chi hộ trong ngày");
    expect(disbursementFailureReason("DAILY_COUNT_LIMIT")).toBe("Vượt số lệnh chi hộ tối đa trong ngày");
    expect(disbursementFailureReason("MONTHLY_AMOUNT_LIMIT")).toBe("Vượt hạn mức chi hộ trong tháng");
    expect(disbursementFailureReason("MONTHLY_COUNT_LIMIT")).toBe("Vượt số lệnh chi hộ tối đa trong tháng");
    expect(disbursementFailureReason("INSUFFICIENT_AVAILABLE")).toBe("Số dư thu-chi hộ khác không đủ");
    expect(disbursementFailureReason("CREDIT_LIMIT_EXCEEDED")).toBe("Vượt hạn mức thanh khoản dự phòng");
    expect(disbursementFailureReason("CREDIT_LIMIT_BELOW_OUTSTANDING")).toMatch(/^Dư nợ Trả sau hiện vượt hạn mức/);
  });

  it("có câu cho mọi mã từ chối chắc chắn của disbursement (SubLedgerClient.DEFINITE_REFUSALS)", () => {
    const definiteRefusals = [
      "SERVICE_DISABLED", "PER_TXN_LIMIT", "DAILY_AMOUNT_LIMIT", "DAILY_COUNT_LIMIT", "MONTHLY_AMOUNT_LIMIT",
      "MONTHLY_COUNT_LIMIT", "INSUFFICIENT_AVAILABLE", "CREDIT_LIMIT_EXCEEDED", "CREDIT_LIMIT_BELOW_OUTSTANDING",
      "INVALID_ALLOCATION", "RESERVATION_NOT_CAPTURED", "REVERSAL_EXCEEDS_SOURCE", "FEE_REFUND_EXCEEDS_SOURCE",
      "OWNER_SCOPE", "REQUEST_MISMATCH", "SOURCE_CLOSED", "UNBALANCED_POSTING", "INVALID_POSTING_EVIDENCE",
      "INVALID_CONTRACT", "ACCOUNTING_PERIOD_MISSING", "ACCOUNTING_PERIOD_CLOSED", "GL_PROFILE_MISSING",
      "PAYOUT_ALREADY_CLEARED",
    ];
    for (const code of definiteRefusals) expect(DISBURSEMENT_FAILURE_REASONS[code], code).toBeTruthy();
  });

  it("dịch các mã kết thúc lệnh ngoài sổ (ngân hàng từ chối, xử lý tay, mã đã che)", () => {
    expect(disbursementFailureReason("BANK_REJECTED")).toBe("Ngân hàng từ chối giao dịch");
    expect(disbursementFailureReason("MANUAL_NOT_PAID")).toBeTruthy();
    expect(disbursementFailureReason("UNSPECIFIED")).toBe("Giao dịch thất bại");
  });

  it("mã lạ hiện câu chung kèm mã để tra soát; bỏ khoảng trắng thừa", () => {
    expect(disbursementFailureReason("SOMETHING_NEW")).toBe("Giao dịch thất bại (mã: SOMETHING_NEW)");
    expect(disbursementFailureReason("  PER_TXN_LIMIT ")).toBe("Số tiền ngoài hạn mức mỗi lệnh chi hộ");
  });

  it("không có mã thì không có lý do", () => {
    expect(disbursementFailureReason(null)).toBeNull();
    expect(disbursementFailureReason(undefined)).toBeNull();
    expect(disbursementFailureReason("   ")).toBeNull();
  });
});
