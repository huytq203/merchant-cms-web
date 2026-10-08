import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { describeWithdrawalError, readFieldErrors } from "../withdrawal-errors";

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

describe("readFieldErrors", () => {
  it("returns only string details", () => {
    expect(readFieldErrors(new ApiError(400, "m", undefined, { amount: "Vượt hạn mức", n: 3 }))).toEqual({ amount: "Vượt hạn mức" });
    expect(readFieldErrors(new Error("x"))).toEqual({});
  });
});
