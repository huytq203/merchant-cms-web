import { describe, expect, it } from "vitest";
import {
  withdrawalCreateBodySchema,
  withdrawalFormSchema,
  withdrawalResponseSchema,
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
