import { describe, expect, it } from "vitest";
import { createRefundFormSchema, revenueRefundSchema } from "../schemas";
import { parseRefundSearchParams } from "../revenue-refund-queries";
import { orderId, pendingRefund, succeededRefund } from "./fixtures";

describe("revenue refund schemas", () => {
  it("parses a pending and a succeeded refund", () => {
    expect(revenueRefundSchema.parse(pendingRefund).status).toBe("PENDING_APPROVAL");
    expect(revenueRefundSchema.parse(succeededRefund).payoutStatus).toBe("PENDING");
  });

  it("drops beneficiary details if the BE ever sends them", () => {
    const parsed = revenueRefundSchema.parse({ ...pendingRefund, beneficiaryAccountNumber: "0123456789" }) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("beneficiaryAccountNumber");
  });

  it("validates the create form the way the BE does", () => {
    const valid = { amount: "40000", reason: "Khách trả hàng, đã xác nhận", beneficiaryBankCode: "VCB", beneficiaryAccountNumber: "0123456789", beneficiaryAccountName: "nguyen van a" };
    expect(createRefundFormSchema.parse(valid)).toEqual({ ...valid, amount: 40_000, beneficiaryAccountName: "NGUYEN VAN A" });
    const issues = createRefundFormSchema.safeParse({ ...valid, amount: "0", reason: "ngắn", beneficiaryAccountNumber: "12a" });
    expect(issues.success ? [] : issues.error.issues.map((issue) => issue.path[0])).toEqual(["amount", "reason", "beneficiaryAccountNumber"]);
  });
});

describe("parseRefundSearchParams", () => {
  it("keeps a known status and an order id", () => {
    expect(parseRefundSearchParams({ status: "FAILED", orderId })).toEqual({ status: "FAILED", orderId });
  });

  it("drops an unknown status and a malformed order id", () => {
    expect(parseRefundSearchParams({ status: "LOST", orderId: "x" })).toEqual({});
  });
});
