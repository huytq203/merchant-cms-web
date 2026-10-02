import { describe, expect, it } from "vitest";

import { changePasswordSchema } from "@/features/account/schemas";

describe("changePasswordSchema", () => {
  const valid = { currentPassword: "Old-pass1!", newPassword: "ValidPass12!x", confirmPassword: "ValidPass12!x" };

  it("accepts a password that satisfies the BE rule", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 10 characters", () => {
    const result = changePasswordSchema.safeParse({ ...valid, newPassword: "Abcdef1!", confirmPassword: "Abcdef1!" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmation on the confirm field", () => {
    const result = changePasswordSchema.safeParse({ ...valid, confirmPassword: "Different12!x" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
