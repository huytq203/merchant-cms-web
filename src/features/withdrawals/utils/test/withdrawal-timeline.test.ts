import { describe, expect, it } from "vitest";
import { withdrawalStatusSchema } from "../../schemas/withdrawal.schema";
import { WITHDRAWAL_STATUS_GROUPS, groupOfStatus } from "../../constants/Withdrawal.constants";
import { WITHDRAWAL_STEPS, withdrawalNote, withdrawalStepStates } from "../withdrawal-timeline";

describe("withdrawal progress", () => {
  it("waits on approval while pending and completes every step when done", () => {
    expect(withdrawalStepStates("PENDING")).toEqual(["done", "current", "upcoming", "upcoming", "upcoming"]);
    expect(withdrawalStepStates("COMPLETED")).toEqual(Array(WITHDRAWAL_STEPS.length).fill("done"));
  });

  it("flags the step a request stopped on", () => {
    expect(withdrawalStepStates("BANK_REJECTED")).toEqual(["done", "done", "done", "failed", "upcoming"]);
    expect(withdrawalStepStates("REJECTED")[1]).toBe("failed");
  });

  it("covers every status BE can send, each with a note", () => {
    for (const status of withdrawalStatusSchema.options) {
      expect(withdrawalStepStates(status)).toHaveLength(WITHDRAWAL_STEPS.length);
      expect(withdrawalNote(status).text).not.toBe("");
    }
  });

  it("does not ask the merchant to act on a reconciliation", () => {
    expect(withdrawalNote("RECONCILIATION_REQUIRED").text).toMatch(/không cần làm gì/);
  });
});

describe("status groups", () => {
  it("put every BE status in exactly one stage", () => {
    const all = WITHDRAWAL_STATUS_GROUPS.flatMap((group) => [...group.statuses]);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...withdrawalStatusSchema.options].sort());
    expect(groupOfStatus("BANK_SUBMITTING")?.value).toBe("PROCESSING");
  });
});
