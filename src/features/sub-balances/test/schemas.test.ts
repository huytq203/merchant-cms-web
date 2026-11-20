import { describe, expect, it } from "vitest";
import { subBalanceReportSchema } from "../schemas";
import { reportFixture } from "./fixtures";


describe("subBalanceReportSchema", () => {
  it("parses the BE report", () => {
    expect(subBalanceReportSchema.parse(reportFixture).availableBalance).toBe(5_000_000);
  });

  it("rejects a report without the available balance", () => {
    const { availableBalance: _omitted, ...rest } = reportFixture;
    void _omitted;
    expect(subBalanceReportSchema.safeParse(rest).success).toBe(false);
  });

  it("subBalanceReportParsesPocketFields", () => {
    const line = (code: string, amount: number) => ({ code, label: code, amount, explanation: "x" });
    const parsed = subBalanceReportSchema.parse({
      ...reportFixture,
      walletAvailable: 3_000_000, otherAvailable: 2_000_000, disbursementReserved: 100_000, overdraft: 400_000, otherDisplayBalance: 1_600_000,
      availableWallet: line("AVAILABLE_WALLET", 3_000_000), availableOther: line("AVAILABLE_OTHER", 2_000_000),
      disbursementHold: line("DISBURSEMENT_RESERVED", 100_000), overdraftDebt: line("OVERDRAFT", 400_000),
    });
    expect(parsed).toMatchObject({ walletAvailable: 3_000_000, otherAvailable: 2_000_000, overdraft: 400_000, otherDisplayBalance: 1_600_000 });
    expect(parsed.availableWallet?.label).toBe("AVAILABLE_WALLET");
    expect(parsed.overdraftDebt?.amount).toBe(400_000);
  });

  it("subBalanceMissingPocketFieldsTolerated", () => {
    const parsed = subBalanceReportSchema.parse(reportFixture);
    expect(parsed.walletAvailable).toBeNull();
    expect(parsed.otherDisplayBalance).toBeNull();
    expect(parsed.availableWallet).toBeNull();
    expect(parsed.disbursementHold).toBeNull();
    expect(subBalanceReportSchema.parse({ ...reportFixture, walletAvailable: null, availableWallet: null }).walletAvailable).toBeNull();
  });
});
