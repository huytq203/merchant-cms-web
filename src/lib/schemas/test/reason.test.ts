import { describe, expect, it } from "vitest";
import { REASON_LENGTH_MESSAGE, reasonBodySchema, reasonSchema } from "../reason";

describe("reasonSchema", () => {
  it("từ chối lý do ngắn hơn 10 ký tự sau khi cắt khoảng trắng", () => {
    const result = reasonSchema.safeParse("   ngắn   ");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe(REASON_LENGTH_MESSAGE);
  });

  it("chấp nhận đúng 10 và đúng 500 ký tự", () => {
    expect(reasonSchema.safeParse("a".repeat(10)).success).toBe(true);
    expect(reasonSchema.safeParse("a".repeat(500)).success).toBe(true);
  });

  it("từ chối lý do dài hơn 500 ký tự", () => {
    expect(reasonSchema.safeParse("a".repeat(501)).success).toBe(false);
  });

  it("cắt khoảng trắng hai đầu khi hợp lệ", () => {
    expect(reasonSchema.parse("  đủ mười ký tự  ")).toBe("đủ mười ký tự");
  });
});

describe("reasonBodySchema", () => {
  it("từ chối body thiếu lý do", () => {
    expect(reasonBodySchema.safeParse({}).success).toBe(false);
  });

  it("chấp nhận body có lý do hợp lệ", () => {
    expect(reasonBodySchema.parse({ reason: "đủ mười ký tự" })).toEqual({ reason: "đủ mười ký tự" });
  });
});
