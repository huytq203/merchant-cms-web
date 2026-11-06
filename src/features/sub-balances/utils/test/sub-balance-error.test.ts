import { describe, expect, it } from "vitest";
import { subBalanceErrorMessage } from "../sub-balance-error";

describe("subBalanceErrorMessage", () => {
  it("names the unreachable ledger instead of a generic server error", () => {
    expect(subBalanceErrorMessage({ status: 503, code: "HTTP_503", message: "Hệ thống đang gặp sự cố" })).toContain("sổ cái");
  });

  it("recognises the ledger error by its code even when the status is not 503", () => {
    expect(subBalanceErrorMessage({ status: 500, code: "MERCHANT_ESCROW_BALANCE_UNAVAILABLE", message: "x" })).toContain("sổ cái");
    expect(subBalanceErrorMessage({ status: 500, code: "5753", message: "x" })).toContain("sổ cái");
  });

  it("treats a Sub outside the scope as not found", () => {
    expect(subBalanceErrorMessage({ status: 404, code: "RESOURCE_NOT_FOUND", message: "x" })).toContain("Không tìm thấy");
  });

  it("keeps the BE message for other failures", () => {
    expect(subBalanceErrorMessage({ status: 400, code: "BUSINESS_ERROR", message: "Câu của BE" })).toBe("Câu của BE");
  });
});
