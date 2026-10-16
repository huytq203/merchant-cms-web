import { describe, expect, it } from "vitest";
import { escrowContributionSchema, escrowLedgerEntrySchema, escrowStandingSchema } from "../schemas";
import { contributionsFixture, ledgerFixture, standingFixture } from "./fixtures";

describe("escrow schemas", () => {
  it("parses the standing, a contribution and a ledger entry", () => {
    expect(escrowStandingSchema.parse(standingFixture).state).toBe("SHORT");
    expect(escrowContributionSchema.parse(contributionsFixture[0]).subMerchantId).toBeNull();
    expect(escrowLedgerEntrySchema.parse(ledgerFixture[2]).amountDelta).toBe(-15_000_000);
  });

  it("keeps the amounts null when the ledger could not be read", () => {
    const parsed = escrowStandingSchema.parse({ ...standingFixture, state: "UNKNOWN", balance: null, shortfall: null, surplus: null, percent: null });
    expect(parsed.balance).toBeNull();
  });

  it("accepts a Master without any escrow configured", () => {
    const parsed = escrowStandingSchema.parse({
      ...standingFixture, state: "NOT_CONFIGURED", requiredAmount: 0, shortfall: null, surplus: null, percent: null,
      deadlineAt: null, daysLeft: null, allowTransfer: null, allowSetoff: null,
    });
    expect(parsed.allowTransfer).toBeNull();
  });

  it("rejects an unknown ledger kind", () => {
    expect(escrowLedgerEntrySchema.safeParse({ ...ledgerFixture[0], kind: "GIFT" }).success).toBe(false);
  });
});
