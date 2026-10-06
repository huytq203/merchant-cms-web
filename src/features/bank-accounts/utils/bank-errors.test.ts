import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/http/api-client";
import { describeBankError } from "./bank-errors";

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
});
