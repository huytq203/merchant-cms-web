import { describe, expect, it } from "vitest";
import {
  isAwaitingApproval,
  isMasterAccount,
  toWithdrawalCreateRequest,
  withdrawalTitle,
  withdrawalTotalDebit,
} from "../withdrawal-mapper";

const input = {
  bankAccountId: "44444444-4444-4444-8444-444444444444",
  amount: 250000,
  idempotencyKey: "key-1",
};

describe("toWithdrawalCreateRequest", () => {
  it("keeps only the account id, amount and idempotency key", () => {
    expect(toWithdrawalCreateRequest(input)).toEqual({
      bankAccountId: input.bankAccountId,
      amount: 250000,
      idempotencyKey: "key-1",
    });
  });

  it("sends the reason only when it has content", () => {
    expect(toWithdrawalCreateRequest({ ...input, reason: "Rút doanh thu" }).reason).toBe("Rút doanh thu");
    expect(toWithdrawalCreateRequest({ ...input, reason: "" })).not.toHaveProperty("reason");
  });
});

describe("isMasterAccount", () => {
  it("accepts a MASTER level or an account without a sub-merchant and refuses lower levels", () => {
    expect(isMasterAccount({ level: "MASTER", subMerchantId: null })).toBe(true);
    expect(isMasterAccount({ level: undefined, subMerchantId: null })).toBe(true);
    expect(isMasterAccount({ level: "SUB", subMerchantId: "33333333-3333-4333-8333-333333333333" })).toBe(false);
    expect(isMasterAccount({ level: "TERMINAL", subMerchantId: "33333333-3333-4333-8333-333333333333" })).toBe(false);
  });
});

describe("withdrawal status helpers", () => {
  it("treats only PENDING as awaiting approval", () => {
    expect(isAwaitingApproval("PENDING")).toBe(true);
    expect(isAwaitingApproval("APPROVED")).toBe(false);
    expect(isAwaitingApproval("COMPLETED")).toBe(false);
  });

  it("adds the fee on top of the amount because the BE reserves amount plus fee", () => {
    expect(withdrawalTotalDebit({ amount: 5_000_000, fee: 5_500 })).toBe(5_005_500);
    expect(withdrawalTotalDebit({ amount: 5_000_000, fee: null })).toBeNull();
  });
});

describe("withdrawalTitle", () => {
  it("uses the code when issued and the bank with a masked number otherwise", () => {
    const base = { bankCode: "VCB", bankAccountMasked: "xxxx1789" };
    expect(withdrawalTitle({ ...base, transactionCode: "WD2601" })).toBe("WD2601");
    expect(withdrawalTitle({ ...base, transactionCode: null })).toBe("Vietcombank xxxx1789");
  });
});
