import { describe, expect, it } from "vitest";
import { withdrawalBlocker } from "../withdrawal-limits";

const balance = {
  readyAmount: 5_000_000,
  dailyLimitRemaining: 500_000_000,
  dailyCountRemaining: 3,
  minimumAmount: 10_000,
  maximumAmount: null,
};

describe("withdrawalBlocker", () => {
  it("lets the ready amount through when every limit allows it and says nothing while the balance is unknown", () => {
    expect(withdrawalBlocker(balance)).toBeNull();
    expect(withdrawalBlocker({ ...balance, dailyLimitRemaining: null, dailyCountRemaining: null })).toBeNull();
    expect(withdrawalBlocker(undefined)).toBeNull();
  });

  it("blocks a Sub that withdraws automatically before any amount rule", () => {
    expect(withdrawalBlocker({ ...balance, automaticSettlement: true })).toMatch(/Điểm bán đang rút tự động theo chu kỳ/);
    expect(withdrawalBlocker({ ...balance, readyAmount: 0, automaticSettlement: true })).toMatch(/rút tự động/);
    expect(withdrawalBlocker({ ...balance, automaticSettlement: false })).toBeNull();
  });

  it("blocks when nothing is ready to withdraw", () => {
    expect(withdrawalBlocker({ ...balance, readyAmount: 0 })).toMatch(/Chưa có khoản nào sẵn sàng/);
  });

  it("blocks with the BE's own words when the remainder after the escrow setoff cannot pay the fee", () => {
    const message = "Số tiền còn lại sau cấn trừ ký quỹ không đủ trả phí rút";
    expect(withdrawalBlocker({ ...balance, blocker: "FEE_EXCEEDS_REMAINDER", blockerMessage: message })).toBe(message);
    // A BE blocker without its sentence still blocks, in the same words.
    expect(withdrawalBlocker({ ...balance, blocker: "FEE_EXCEEDS_REMAINDER", blockerMessage: null })).toBe(message);
    // An older BE that still sends a negative net is blocked the same way.
    expect(withdrawalBlocker({ ...balance, netReceived: -3_000 })).toBe(message);
    // Automatic mode and "nothing ready" still come first.
    expect(withdrawalBlocker({ ...balance, readyAmount: 0, blocker: "FEE_EXCEEDS_REMAINDER" })).toMatch(/Chưa có khoản nào sẵn sàng/);
  });

  it("does not block a zero net payout: that one is confirmed on the review step", () => {
    expect(withdrawalBlocker({ ...balance, netReceived: 0, blocker: null })).toBeNull();
  });

  it("names the first limit the ready amount breaks", () => {
    expect(withdrawalBlocker({ ...balance, dailyCountRemaining: 0 })).toMatch(/số lần rút/);
    expect(withdrawalBlocker({ ...balance, readyAmount: 5_000 })).toMatch(/tối thiểu/);
    expect(withdrawalBlocker({ ...balance, maximumAmount: 1_000_000 })).toMatch(/tối đa mỗi lần/);
    expect(withdrawalBlocker({ ...balance, dailyLimitRemaining: 1_000_000 })).toMatch(/hạn mức rút còn lại/);
  });
});
