import { describe, expect, it } from "vitest";
import {
  isAwaitingApproval,
  isSubMerchantAccount,
  toWithdrawalCreateRequest,
  withdrawalBreakdown,
  withdrawalTitle,
} from "../withdrawal-mapper";

const input = {
  bankAccountId: "44444444-4444-4444-8444-444444444444",
  amount: 250000,
  idempotencyKey: "key-1",
  otp: { otpSessionId: "sess-1", otp: "123456" },
};

describe("toWithdrawalCreateRequest", () => {
  it("keeps only the account id, amount, idempotency key and the OTP answer under the BE name sensitiveOtp", () => {
    const request = toWithdrawalCreateRequest(input);
    expect(request).toEqual({
      bankAccountId: input.bankAccountId,
      amount: 250000,
      idempotencyKey: "key-1",
      sensitiveOtp: { otpSessionId: "sess-1", otp: "123456" },
    });
    expect(request).not.toHaveProperty("otp");
  });

  it("sends confirmZeroNet only when the merchant accepted a zero net payout", () => {
    expect(toWithdrawalCreateRequest({ ...input, confirmZeroNet: true }).confirmZeroNet).toBe(true);
    expect(toWithdrawalCreateRequest({ ...input, confirmZeroNet: false })).not.toHaveProperty("confirmZeroNet");
    expect(toWithdrawalCreateRequest(input)).not.toHaveProperty("confirmZeroNet");
  });

  it("sends the reason only when it has content", () => {
    expect(toWithdrawalCreateRequest({ ...input, reason: "Rút doanh thu" }).reason).toBe("Rút doanh thu");
    expect(toWithdrawalCreateRequest({ ...input, reason: "" })).not.toHaveProperty("reason");
  });
});

describe("isSubMerchantAccount", () => {
  const subId = "33333333-3333-4333-8333-333333333333";
  const account = (overrides: object) => ({ id: "a", ...overrides }) as Parameters<typeof isSubMerchantAccount>[0];

  it("accepts an account that belongs to a Sub and refuses a Master account", () => {
    expect(isSubMerchantAccount(account({ level: "SUB", subMerchantId: subId }))).toBe(true);
    expect(isSubMerchantAccount(account({ level: "MASTER" }))).toBe(false);
    expect(isSubMerchantAccount(account({ level: undefined, subMerchantId: undefined }))).toBe(false);
  });
});

describe("withdrawal status helpers", () => {
  it("treats only PENDING as awaiting approval", () => {
    expect(isAwaitingApproval("PENDING")).toBe(true);
    expect(isAwaitingApproval("APPROVED")).toBe(false);
    expect(isAwaitingApproval("COMPLETED")).toBe(false);
  });

});

describe("withdrawalBreakdown", () => {
  const sub = { amount: 1_568_000, setoffAmount: 1_000_000, fee: 5_680, netReceived: 562_320, payoutFeeMode: "DEDUCT" as const };

  it("takes the setoff and the fee out of a Sub request (FM26I4MEO): no fee on top, no wallet total", () => {
    expect(withdrawalBreakdown(sub)).toEqual({ setoff: 1_000_000, fee: 5_680, net: 562_320, totalDebit: null });
  });

  it("works the net out when the BE does not send it", () => {
    expect(withdrawalBreakdown({ ...sub, netReceived: null }).net).toBe(562_320);
    expect(withdrawalBreakdown({ ...sub, netReceived: null, fee: null }).net).toBeNull();
  });

  it("keeps the fee on top for an old ADD_ON request, whose wallet was charged amount plus fee", () => {
    expect(withdrawalBreakdown({ amount: 5_000_000, setoffAmount: 0, fee: 5_500, netReceived: null, payoutFeeMode: "ADD_ON" }))
      .toEqual({ setoff: 0, fee: 5_500, net: 5_000_000, totalDebit: 5_005_500 });
  });
});

describe("withdrawalTitle", () => {
  it("uses the code when issued and the bank with a masked number otherwise", () => {
    const base = { bankCode: "VCB", bankAccountMasked: "xxxx1789" };
    expect(withdrawalTitle({ ...base, transactionCode: "WD2601" })).toBe("WD2601");
    expect(withdrawalTitle({ ...base, transactionCode: null })).toBe("Vietcombank xxxx1789");
  });
});
