import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { describeWithdrawalError, readFieldErrors, withdrawalFailureKind } from "../withdrawal-errors";

describe("describeWithdrawalError", () => {
  it("keeps the BE message so an amount above the balance stays visible", () => {
    expect(describeWithdrawalError(new ApiError(400, "Số dư không đủ", "BUSINESS_ERROR"))).toBe("Số dư không đủ");
  });

  it("replaces the known BE codes with Vietnamese text and falls back for unknown errors", () => {
    expect(describeWithdrawalError(new ApiError(409, "Dữ liệu bị trùng lặp", "DUPLICATE_KEY_ERROR"))).toMatch(/đã được gửi/);
    expect(describeWithdrawalError(new ApiError(404, "Not found", "BANK_NOT_FOUND"))).toMatch(/ngân hàng/);
    expect(describeWithdrawalError(new Error("x"))).toMatch(/thử lại/);
  });
});

describe("automatic settlement and pending freeze refusals", () => {
  it("recognises 5782 and 5798 by number or name and keeps the Vietnamese BE message", () => {
    const automatic = new ApiError(409, "Sub-merchant đang ở chế độ quyết toán tự động; hệ thống tự tạo lệnh rút theo chu kỳ", "5782");
    const freezing = new ApiError(409, "Sub-merchant đang có lệnh đóng băng chờ xử lý; vui lòng thử lại sau ít phút", "MERCHANT_WITHDRAWAL_FREEZE_PROCESSING");
    expect(withdrawalFailureKind(automatic)).toBe("automaticMode");
    expect(withdrawalFailureKind(new ApiError(409, "x", "MERCHANT_WITHDRAWAL_AUTOMATIC_MODE"))).toBe("automaticMode");
    expect(withdrawalFailureKind(freezing)).toBe("freezeProcessing");
    expect(withdrawalFailureKind(new ApiError(409, "x", "5798"))).toBe("freezeProcessing");
    expect(describeWithdrawalError(automatic)).toBe(automatic.message);
    expect(describeWithdrawalError(freezing)).toBe(freezing.message);
  });
});

describe("describeWithdrawalError translations", () => {
  const business = (message: string) => new ApiError(400, message, "BUSINESS_ERROR");

  it("translates the limit and hold rules the BE throws in English", () => {
    expect(describeWithdrawalError(business("Withdrawal bank account is on hold"))).toMatch(/tạm giữ/);
    expect(describeWithdrawalError(business("Withdrawal amount is below the configured minimum at MERCHANT"))).toMatch(/tối thiểu/);
    expect(describeWithdrawalError(business("Withdrawal amount exceeds the configured maximum at SUB_MERCHANT"))).toMatch(/tối đa/);
    expect(describeWithdrawalError(business("Daily merchant withdrawal limit exceeded at MERCHANT"))).toMatch(/trong ngày/);
    expect(describeWithdrawalError(business("Merchant settlement limits are suspended"))).toMatch(/tạm ngưng/);
    expect(describeWithdrawalError(business("Withdrawal amount must be positive"))).toMatch(/lớn hơn 0/);
  });

  it("translates the account-not-registered rule even when it arrives as a plain business error", () => {
    expect(describeWithdrawalError(business("Withdrawal bank account is not registered and active for this merchant"))).toMatch(/chưa đăng ký/);
  });

  it("translates the idempotency and processing messages", () => {
    const reused = new ApiError(409, "Idempotency key was already used with a different withdrawal payload", "DUPLICATE_KEY_ERROR");
    expect(describeWithdrawalError(reused)).toMatch(/đã được gửi/);
    expect(describeWithdrawalError(new ApiError(403, "Withdrawal idempotency key belongs to a different requester", "FORBIDDEN"))).toMatch(/người dùng khác/);
    expect(describeWithdrawalError(business("Withdrawal has already entered payout processing; use the reconcile action"))).toMatch(/chi trả/);
  });
});

describe("withdrawalFailureKind", () => {
  const failure = (status: number, code: string, message = "Thông báo của BE") => new ApiError(status, message, code);

  it.each([
    ["5731", "MERCHANT_SENSITIVE_OTP_REQUIRED", "otpRequired", 400],
    ["5732", "MERCHANT_SENSITIVE_OTP_INVALID", "otpInvalid", 400],
    ["5733", "MERCHANT_SENSITIVE_OTP_ISSUE_FAILED", "otpIssueFailed", 502],
    ["5760", "MERCHANT_WITHDRAWAL_ZERO_NET_CONFIRMATION", "zeroNet", 409],
    ["5780", "MERCHANT_WITHDRAWAL_NOTHING_READY", "nothingReady", 409],
    ["5781", "MERCHANT_WITHDRAWAL_STATEMENT_CHANGED", "statementChanged", 409],
    ["5753", "MERCHANT_ESCROW_BALANCE_UNAVAILABLE", "ledgerUnavailable", 503],
  ] as const)("branches %s and its name on the code, not on the text", (numeric, name, kind, status) => {
    expect(withdrawalFailureKind(failure(status, numeric))).toBe(kind);
    expect(withdrawalFailureKind(failure(status, name))).toBe(kind);
  });

  it("treats a bare 503 as the ledger not answering and everything else as other", () => {
    expect(withdrawalFailureKind(failure(503, "HTTP_503"))).toBe("ledgerUnavailable");
    expect(withdrawalFailureKind(failure(502, "HTTP_503"))).toBe("ledgerUnavailable");
    expect(withdrawalFailureKind(failure(400, "BUSINESS_ERROR"))).toBe("other");
    expect(withdrawalFailureKind(new Error("x"))).toBe("other");
  });
});

describe("describeWithdrawalError for the new BE codes", () => {
  it("shows the Vietnamese BE message for OTP, zero net, nothing ready and statement changed", () => {
    const changed = new ApiError(409, "Tổng tiền rút đã đổi thành 6.000.000", "MERCHANT_WITHDRAWAL_STATEMENT_CHANGED");
    expect(describeWithdrawalError(changed)).toBe("Tổng tiền rút đã đổi thành 6.000.000");
    expect(describeWithdrawalError(new ApiError(400, "Mã OTP không đúng", "5732"))).toBe("Mã OTP không đúng");
    expect(describeWithdrawalError(new ApiError(400, "Cần nhập OTP", "5731"))).toBe("Cần nhập OTP");
    expect(describeWithdrawalError(new ApiError(409, "Thực nhận bằng 0", "5760"))).toBe("Thực nhận bằng 0");
    expect(describeWithdrawalError(new ApiError(409, "Không có khoản nào sẵn sàng", "5780"))).toBe("Không có khoản nào sẵn sàng");
  });

  it("replaces the generic 5xx text for an OTP that could not be issued and for the ledger", () => {
    expect(describeWithdrawalError(new ApiError(502, "Hệ thống đang gặp sự cố", "5733"))).toMatch(/Không gửi được mã OTP/);
    expect(describeWithdrawalError(new ApiError(502, "Hệ thống đang gặp sự cố", "HTTP_503"))).toMatch(/sổ cái/);
  });

  it("keeps BANK_NOT_FOUND and DUPLICATE_KEY_ERROR", () => {
    expect(describeWithdrawalError(new ApiError(404, "x", "BANK_NOT_FOUND"))).toMatch(/ngân hàng/);
    expect(describeWithdrawalError(new ApiError(409, "x", "DUPLICATE_KEY_ERROR"))).toMatch(/đã được gửi/);
  });
});

describe("readFieldErrors", () => {
  it("returns only string details", () => {
    expect(readFieldErrors(new ApiError(400, "m", undefined, { amount: "Vượt hạn mức", n: 3 }))).toEqual({ amount: "Vượt hạn mức" });
    expect(readFieldErrors(new Error("x"))).toEqual({});
  });
});
