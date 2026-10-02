import { describe, expect, it } from "vitest";

import {
  forgotPasswordSchema,
  loginSchema,
  newPasswordSchema,
  otpSchema,
} from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("trims and lower-cases the email", () => {
    const parsed = loginSchema.parse({ email: "  An@Shop.VN ", password: "x" });
    expect(parsed.email).toBe("an@shop.vn");
  });

  it("rejects a malformed email and an empty password", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("Email không hợp lệ");
      expect(messages).toContain("Vui lòng nhập mật khẩu");
    }
  });
});

describe("otpSchema", () => {
  it("accepts exactly six digits", () => {
    expect(otpSchema.safeParse({ otp: "123456" }).success).toBe(true);
    expect(otpSchema.safeParse({ otp: "12345" }).success).toBe(false);
    expect(otpSchema.safeParse({ otp: "12a456" }).success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@b.vn" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "a@" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it.each([
    ["Short1!a", false],
    ["alllowercase1!x", false],
    ["ALLUPPERCASE1!X", false],
    ["NoDigitsHere!!", false],
    ["NoSpecial12345", false],
    ["Has Space1!abc", false],
    ["Valid-Pass1!x", false],
    ["ValidPass12!x", true],
  ])("validates %s", (value, expected) => {
    expect(newPasswordSchema.safeParse(value).success).toBe(expected);
  });
});
