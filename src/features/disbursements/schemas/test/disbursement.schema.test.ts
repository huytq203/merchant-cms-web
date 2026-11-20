import { describe, expect, it } from "vitest";
import { batchSubmitBodySchema, disbursementFormSchema } from "../disbursement.schema";
import { SUB_ID } from "../../test/fixtures";

const valid = {
  subId: SUB_ID,
  merchantRequestCode: "P2611191200000001",
  amount: 1_000_000,
  bankCode: "VCB",
  accountNumber: "0123456789",
};

describe("disbursementFormSchema", () => {
  it("requestCodePatternAndMax50", () => {
    expect(disbursementFormSchema.safeParse(valid).success).toBe(true);
    expect(disbursementFormSchema.safeParse({ ...valid, merchantRequestCode: "A".repeat(50) }).success).toBe(true);
    // Quá 50 ký tự.
    expect(disbursementFormSchema.safeParse({ ...valid, merchantRequestCode: "A".repeat(51) }).success).toBe(false);
    // Ký tự ngoài [A-Za-z0-9._:-]: khoảng trắng, dấu tiếng Việt, gạch chéo, rỗng.
    for (const bad of ["MA 01", "mã01", "A/B", ""]) {
      expect(disbursementFormSchema.safeParse({ ...valid, merchantRequestCode: bad }).success).toBe(false);
    }
    expect(disbursementFormSchema.safeParse({ ...valid, merchantRequestCode: "a.B_c:d-1" }).success).toBe(true);
  });

  it("descriptionMax255", () => {
    expect(disbursementFormSchema.safeParse({ ...valid, description: "x".repeat(255) }).success).toBe(true);
    expect(disbursementFormSchema.safeParse({ ...valid, description: "x".repeat(256) }).success).toBe(false);
    // Không đặt tối thiểu cho nội dung: bỏ trống vẫn hợp lệ.
    expect(disbursementFormSchema.safeParse({ ...valid, description: "" }).success).toBe(true);
  });

  it("rejects a non-positive or fractional amount", () => {
    for (const amount of [0, -1, 1.5]) {
      expect(disbursementFormSchema.safeParse({ ...valid, amount }).success).toBe(false);
    }
  });
});

describe("batchSubmitBodySchema", () => {
  it("batchSubmitNeedsOtp", () => {
    expect(batchSubmitBodySchema.safeParse({ expectedVersion: 1 }).success).toBe(false);
    expect(batchSubmitBodySchema.safeParse({ expectedVersion: 1, sensitiveOtp: { otpSessionId: "s", otp: "12" } }).success).toBe(false);
    expect(batchSubmitBodySchema.safeParse({ expectedVersion: 1, sensitiveOtp: { otpSessionId: "s", otp: "123456" } }).success).toBe(true);
  });
});
