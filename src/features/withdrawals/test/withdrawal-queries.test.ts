import { describe, expect, it } from "vitest";
import { parseWithdrawalSearchParams, toWithdrawalSearchParams, withdrawalQueries } from "../withdrawal-queries";

describe("withdrawal search params", () => {
  it("falls back to safe defaults for malformed pagination", () => {
    expect(parseWithdrawalSearchParams({ page: "0", pageSize: "500" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("keeps a valid stage, trimmed code and calendar days, and drops malformed ones", () => {
    expect(parseWithdrawalSearchParams({
      page: "3", pageSize: "50", status: "PROCESSING", transactionCode: " WD1 ",
      createdFrom: "2026-01-01", createdTo: "2026-01-31",
    })).toEqual({
      page: 3, pageSize: 50, statusGroup: "PROCESSING", transactionCode: "WD1",
      createdFrom: "2026-01-01", createdTo: "2026-01-31",
    });
    expect(parseWithdrawalSearchParams({ status: "PENDINGX", createdFrom: "01/01/2026", createdTo: "2026-13-40" }))
      .toEqual({ page: 1, pageSize: 10 });
  });

  it("puts every filter into the page URL and the query key", () => {
    const filter = { page: 2, pageSize: 20, statusGroup: "COMPLETED", transactionCode: "WD", createdFrom: "2026-01-01" } as const;
    expect(toWithdrawalSearchParams(filter).toString())
      .toBe("page=2&pageSize=20&transactionCode=WD&status=COMPLETED&createdFrom=2026-01-01");
    expect(withdrawalQueries.list(filter).queryKey).toEqual(["withdrawals", "list", filter]);
    expect(withdrawalQueries.list({ ...filter, page: 3 }).queryKey).not.toEqual(withdrawalQueries.list(filter).queryKey);
  });

  it("keys bank options by sub-merchant so a change refetches", () => {
    expect(withdrawalQueries.bankOptions("a").queryKey).not.toEqual(withdrawalQueries.bankOptions("b").queryKey);
    expect(withdrawalQueries.bankOptions().queryKey).toEqual(["withdrawals", "bank-options", ""]);
  });
});
