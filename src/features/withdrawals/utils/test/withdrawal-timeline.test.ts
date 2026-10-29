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

  it("treats the retired RECONCILIATION_REQUIRED like PROCESSING: in progress, not failed", () => {
    expect(withdrawalStepStates("RECONCILIATION_REQUIRED")).toEqual(withdrawalStepStates("PROCESSING"));
    expect(withdrawalStepStates("RECONCILIATION_REQUIRED")).not.toContain("failed");
    expect(withdrawalNote("RECONCILIATION_REQUIRED")).toEqual(withdrawalNote("PROCESSING"));
  });
});

describe("status groups", () => {
  it("put every BE status in exactly one stage", () => {
    const all = WITHDRAWAL_STATUS_GROUPS.flatMap((group) => [...group.statuses]);
    expect(new Set(all).size).toBe(all.length);
    // Alias chuyển tiếp is never sent to BE as a filter value, so it is not in any group's list.
    const current = withdrawalStatusSchema.options.filter((status) => status !== "RECONCILIATION_REQUIRED");
    expect([...all].sort()).toEqual([...current].sort());
    expect(groupOfStatus("BANK_SUBMITTING")?.value).toBe("PROCESSING");
  });

  it("offers no reconciliation stage, but still reads the retired status as processing", () => {
    expect(WITHDRAWAL_STATUS_GROUPS.map((group) => group.value)).not.toContain("RECONCILIATION");
    expect(WITHDRAWAL_STATUS_GROUPS.flatMap((group) => [...group.statuses])).not.toContain("RECONCILIATION_REQUIRED");
    expect(groupOfStatus("RECONCILIATION_REQUIRED")?.value).toBe("PROCESSING");
  });
});
