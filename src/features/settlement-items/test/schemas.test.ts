import { describe, expect, it } from "vitest";
import { settlementItemDetailSchema, settlementItemSchema, settlementTotalsSchema } from "../schemas";
import { detailFixture, rowFixture, totalsFixture } from "./fixtures";

describe("settlement item schemas", () => {
  it("parses a row and the totals", () => {
    expect(settlementItemSchema.parse(rowFixture).orderCode).toBe("MO20261013000123");
    expect(settlementTotalsSchema.parse(totalsFixture).count).toBe(128);
  });

  it("accepts a row without a hold tranche", () => {
    const parsed = settlementItemSchema.parse({ ...rowFixture, heldAmount: 0, holdTrancheStatus: null });
    expect(parsed.holdTrancheStatus).toBeNull();
  });

  it("drops the internal fee and hold snapshots so they never reach the browser", () => {
    const parsed = settlementItemDetailSchema.parse(detailFixture) as Record<string, unknown>;
    expect(parsed.lines).toHaveLength(4);
    expect(parsed).not.toHaveProperty("feeQuoteSnapshot");
    expect(parsed).not.toHaveProperty("holdRuleSnapshot");
    expect(parsed).not.toHaveProperty("lotId");
  });

  it("rejects an unknown line status", () => {
    const broken = { ...detailFixture, lines: [{ ...detailFixture.lines[0], status: "LOST" }] };
    expect(settlementItemDetailSchema.safeParse(broken).success).toBe(false);
  });
});
