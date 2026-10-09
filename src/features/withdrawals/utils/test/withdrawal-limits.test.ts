import { describe, expect, it } from "vitest";
import { amountProblem, maxWithdrawable } from "../withdrawal-limits";

const balance = { availableBalance: 128_450_000, dailyLimitRemaining: 500_000_000, minimumAmount: 10_000, maximumAmount: null };

describe("maxWithdrawable", () => {
  it("is the tightest of the balance, today's limit and the per-request maximum", () => {
    expect(maxWithdrawable(balance)).toBe(128_450_000);
    expect(maxWithdrawable({ ...balance, dailyLimitRemaining: 1_000_000 })).toBe(1_000_000);
    expect(maxWithdrawable({ ...balance, maximumAmount: 5_000_000 })).toBe(5_000_000);
    expect(maxWithdrawable({ ...balance, dailyLimitRemaining: null })).toBe(128_450_000);
  });
});

describe("amountProblem", () => {
  it("accepts an amount inside every limit and says nothing while the balance is unknown", () => {
    expect(amountProblem(10_000_000, balance)).toBeNull();
    expect(amountProblem(999_999_999_999, undefined)).toBeNull();
    expect(amountProblem(0, balance)).toBeNull();
  });

  it("names the first rule the amount breaks", () => {
    expect(amountProblem(5_000, balance)).toMatch(/tối thiểu/);
    expect(amountProblem(6_000_000, { ...balance, maximumAmount: 5_000_000 })).toMatch(/tối đa mỗi lần/);
    expect(amountProblem(200_000_000, balance)).toMatch(/số dư khả dụng/);
    expect(amountProblem(2_000_000, { ...balance, dailyLimitRemaining: 1_000_000 })).toMatch(/hạn mức rút còn lại/);
  });
});
