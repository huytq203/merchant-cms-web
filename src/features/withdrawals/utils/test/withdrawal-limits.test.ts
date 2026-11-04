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

  it("names the first limit the ready amount breaks", () => {
    expect(withdrawalBlocker({ ...balance, dailyCountRemaining: 0 })).toMatch(/số lần rút/);
    expect(withdrawalBlocker({ ...balance, readyAmount: 5_000 })).toMatch(/tối thiểu/);
    expect(withdrawalBlocker({ ...balance, maximumAmount: 1_000_000 })).toMatch(/tối đa mỗi lần/);
    expect(withdrawalBlocker({ ...balance, dailyLimitRemaining: 1_000_000 })).toMatch(/hạn mức rút còn lại/);
  });
});
