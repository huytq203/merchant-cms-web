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
});
