import { describe, expect, it } from "vitest";
import {
  withdrawalBalanceSchema,
  withdrawalCreateBodySchema,
  withdrawalFormSchema,
  withdrawalOtpChallengeBodySchema,
  withdrawalResponseSchema,
  withdrawalStatusGroupSchema,
  withdrawalStatusSchema,
} from "../withdrawal.schema";

const id = "33333333-3333-4333-8333-333333333333";
const merchantId = "22222222-2222-4222-8222-222222222222";
const bankAccountId = "44444444-4444-4444-8444-444444444444";
const response = {
  id,
  merchantId,
  requestType: "MANUAL",
  amount: 5_000_000,
  fee: 5_500,
  currency: "VND",
  bankCode: "VCB",
  bankAccountNumber: "******1789",
  bankAccountName: "CONG TY A",
  status: "PENDING",
  createdAt: "2026-01-13T09:30:00",
};

describe("withdrawal response schema", () => {
  it("parses the portal record and keeps the account number BE already masked", () => {
    const parsed = withdrawalResponseSchema.parse(response);
    expect(parsed).toMatchObject({ id, merchantId, amount: 5_000_000, fee: 5_500, status: "PENDING" });
    expect(parsed.bankAccountMasked).toBe("******1789");
  });

  it("drops ledger and gateway fields even if BE sends them", () => {
    const parsed = withdrawalResponseSchema.parse({
      ...response,
      journalId: "66666666-6666-4666-8666-666666666666",
      idempotencyKey: "key-1",
      failureReason: "lỗi",
    });
    expect(parsed).not.toHaveProperty("journalId");
    expect(parsed).not.toHaveProperty("idempotencyKey");
    expect(parsed).not.toHaveProperty("failureReason");
  });

  it("accepts nullable and absent optional fields", () => {
    const parsed = withdrawalResponseSchema.parse({
      ...response,
      fee: null,
      transactionCode: null,
      reason: null,
    });
    expect(parsed.fee).toBeNull();
    expect(parsed.transactionCode).toBeNull();
  });

  it("rejects an unknown status, a non-UUID id and a fractional amount", () => {
    expect(withdrawalResponseSchema.safeParse({ ...response, status: "PAID" }).success).toBe(false);
    expect(withdrawalResponseSchema.safeParse({ ...response, id: "abc" }).success).toBe(false);
    expect(withdrawalResponseSchema.safeParse({ ...response, amount: 10.5 }).success).toBe(false);
  });

  it("still parses the retired RECONCILIATION_REQUIRED from an older BE (alias chuyển tiếp)", () => {
    expect(withdrawalResponseSchema.parse({ ...response, status: "RECONCILIATION_REQUIRED" }).status).toBe("RECONCILIATION_REQUIRED");
  });

  it("no longer accepts RECONCILIATION as a filter group", () => {
    expect(withdrawalStatusGroupSchema.safeParse("RECONCILIATION").success).toBe(false);
  });

  it("knows every status the BE enum can return", () => {
    for (const status of [
      "PENDING", "FUNDS_RESERVING", "FUNDS_RESERVED", "BANK_SUBMITTING", "BANK_ACCEPTED", "BANK_REJECTED",
      "RECONCILIATION_REQUIRED", "LEDGER_CAPTURING", "FUNDS_RELEASING", "APPROVED", "REJECTED", "PROCESSING",
      "COMPLETED", "FAILED",
    ]) {
      expect(withdrawalStatusSchema.safeParse(status).success).toBe(true);
    }
  });
});

describe("withdrawal form schema", () => {
  const form = { bankAccountId, amount: "250000", reason: "Rút doanh thu" };

  it("accepts a valid form and coerces the amount", () => {
    expect(withdrawalFormSchema.parse(form)).toEqual({ bankAccountId, amount: 250000, reason: "Rút doanh thu" });
  });

  it("blocks zero, empty, fractional and unsafe amounts", () => {
    for (const amount of ["0", "", "1.5", "99999999999999999999"]) {
      expect(withdrawalFormSchema.safeParse({ ...form, amount }).success).toBe(false);
    }
  });

  it("requires a bank account and limits the reason to 500 characters", () => {
    expect(withdrawalFormSchema.safeParse({ ...form, bankAccountId: "" }).success).toBe(false);
    expect(withdrawalFormSchema.safeParse({ ...form, reason: "a".repeat(501) }).success).toBe(false);
  });

  it("requires an idempotency key and the OTP answer on the create body", () => {
    const otp = { otpSessionId: "sess-1", otp: "123456" };
    expect(withdrawalCreateBodySchema.safeParse({ ...form, otp }).success).toBe(false);
    expect(withdrawalCreateBodySchema.safeParse({ ...form, otp, idempotencyKey: "k".repeat(101) }).success).toBe(false);
    expect(withdrawalCreateBodySchema.safeParse({ ...form, idempotencyKey: "key-1" }).success).toBe(false);
    expect(withdrawalCreateBodySchema.safeParse({ ...form, idempotencyKey: "key-1", otp: { ...otp, otp: "12" } }).success).toBe(false);
    expect(withdrawalCreateBodySchema.safeParse({ ...form, idempotencyKey: "key-1", otp }).success).toBe(true);
  });
});

describe("withdrawal balance schema", () => {
  const subMerchantId = "11111111-1111-4111-8111-111111111111";
  const balance = {
    subMerchantId, availableBalance: 100, heldBalance: 20, pendingSettlement: 30, readyAmount: 6_000_000,
    setoff: 1_000, fee: 5_500, netReceived: 5_993_500, zeroNet: false, minimumAmount: 10_000,
    maximumAmount: null, dailyLimitRemaining: 500_000_000, dailyCountRemaining: 4, asOf: "2026-10-26T03:00:00Z",
  };

  it("parses the per Sub balance with the ready amount, setoff, fee and net received", () => {
    expect(withdrawalBalanceSchema.parse(balance)).toMatchObject({ subMerchantId, readyAmount: 6_000_000, setoff: 1_000, fee: 5_500, netReceived: 5_993_500, zeroNet: false });
  });

  it("keeps a missing limit as null, including the daily count", () => {
    const { maximumAmount: _max, dailyCountRemaining: _count, ...partial } = balance;
    void _max; void _count;
    expect(withdrawalBalanceSchema.parse(partial)).toMatchObject({ maximumAmount: null, dailyCountRemaining: null });
  });

  it("reads the automatic settlement mode of the Sub, and treats a BE that does not send it as manual", () => {
    expect(withdrawalBalanceSchema.parse({ ...balance, automaticSettlement: true }).automaticSettlement).toBe(true);
    expect(withdrawalBalanceSchema.parse(balance).automaticSettlement).toBe(false);
  });

  it("refuses the old merchant shaped answer", () => {
    expect(withdrawalBalanceSchema.safeParse({ merchantId, availableBalance: 1, heldBalance: 0 }).success).toBe(false);
  });
});

describe("withdrawal OTP challenge body schema", () => {
  it("needs the account and a whole amount of at least 1", () => {
    expect(withdrawalOtpChallengeBodySchema.safeParse({ bankAccountId, amount: 6_000_000 }).success).toBe(true);
    expect(withdrawalOtpChallengeBodySchema.safeParse({ bankAccountId, amount: 0 }).success).toBe(false);
    expect(withdrawalOtpChallengeBodySchema.safeParse({ bankAccountId, amount: 1.5 }).success).toBe(false);
    expect(withdrawalOtpChallengeBodySchema.safeParse({ amount: 10 }).success).toBe(false);
  });
});

describe("withdrawal create body confirmZeroNet", () => {
  it("is optional and must be a boolean", () => {
    const body = { bankAccountId, amount: 5, idempotencyKey: "k", otp: { otpSessionId: "s", otp: "123456" } };
    expect(withdrawalCreateBodySchema.safeParse(body).success).toBe(true);
    expect(withdrawalCreateBodySchema.safeParse({ ...body, confirmZeroNet: true }).success).toBe(true);
    expect(withdrawalCreateBodySchema.safeParse({ ...body, confirmZeroNet: "yes" }).success).toBe(false);
  });
});
