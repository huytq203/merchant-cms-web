import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { describeBankError } from "../bank-errors";

describe("describeBankError", () => {
  it("tells a wrong OTP apart from other failures", () => {
    const view = describeBankError(new ApiError(400, "wrong", "MERCHANT_SENSITIVE_OTP_INVALID"));
    expect(view.kind).toBe("otp");
    expect(view.message).not.toMatch(/MERCHANT_/);
  });

  it("treats a stale version (409) as a conflict that needs a reload", () => {
    expect(describeBankError(new ApiError(409, "x", "VERSION_CONFLICT")).kind).toBe("conflict");
  });

  it("does not treat an already pending request as a stale version", () => {
    const view = describeBankError(new ApiError(409, "x", "MERCHANT_BANK_ACCOUNT_CHANGE_ALREADY_PENDING"));
    expect(view.kind).toBe("other");
  });

  it("keeps the server message for other API errors and hides unknown errors", () => {
    expect(describeBankError(new ApiError(400, "Số tài khoản trùng"))).toEqual({ kind: "other", message: "Số tài khoản trùng" });
    expect(describeBankError(new Error("boom")).kind).toBe("other");
  });

  it("puts a failed bank name inquiry (5803) or a holder name the bank or KYB does not confirm (5804, 5729) on the holder field", () => {
    const inquiry = "Chưa tra cứu được tên chủ tài khoản từ ngân hàng. Vui lòng kiểm tra lại ngân hàng, số tài khoản và thử lại sau";
    expect(describeBankError(new ApiError(400, inquiry, "5803"))).toEqual({ kind: "holderName", message: inquiry });
    const mismatch = "Tên chủ tài khoản không khớp tên chủ tài khoản tại ngân hàng. Vui lòng kiểm tra lại";
    expect(describeBankError(new ApiError(400, mismatch, "MERCHANT_BANK_ACCOUNT_HOLDER_BANK_MISMATCH"))).toEqual({ kind: "holderName", message: mismatch });
    expect(describeBankError(new ApiError(400, "x", "5804")).kind).toBe("holderName");
    expect(describeBankError(new ApiError(400, "x", "5729")).kind).toBe("holderName");
  });
});
