import { describe, expect, it } from "vitest";
import { bankAccountQueries, parseBankAccountSearchParams } from "../bank-account-queries";

describe("bank account search params", () => {
  it("falls back to safe defaults for invalid values, including the retired link/usage filters", () => {
    expect(parseBankAccountSearchParams({
      page: "0", pageSize: "500", accountStatus: "WRONG", assignmentStatus: ["ASSIGNED"], linkStatus: "LINKED", status: "ACTIVE",
    })).toEqual({ page: 1, pageSize: 10 });
  });

  it("keeps valid filters", () => {
    expect(parseBankAccountSearchParams({ page: "3", pageSize: "20", assignmentStatus: "UNASSIGNED", accountStatus: "LOCKED" }))
      .toEqual({ page: 3, pageSize: 20, assignmentStatus: "UNASSIGNED", accountStatus: "LOCKED" });
  });

  it("keeps a trimmed search text", () => {
    expect(parseBankAccountSearchParams({ query: "  7890 " })).toEqual({ page: 1, pageSize: 10, query: "7890" });
    expect(parseBankAccountSearchParams({ query: "   " })).toEqual({ page: 1, pageSize: 10 });
  });

  it("reads the Sub-merchant filter from the URL and drops an invalid id", () => {
    const sub = "77777777-7777-4777-8777-777777777777";
    expect(parseBankAccountSearchParams({ subMerchantIds: `${sub},${sub}` })).toEqual({ page: 1, pageSize: 10, subMerchantIds: [sub] });
    expect(parseBankAccountSearchParams({ subMerchantId: sub })).toEqual({ page: 1, pageSize: 10, subMerchantIds: [sub] });
    expect(parseBankAccountSearchParams({ subMerchantIds: "not-an-id" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("puts every filter and the Master into the query key", () => {
    const filter = { page: 2, pageSize: 10, merchantId: "m1", assignmentStatus: "ASSIGNED" as const };
    expect(bankAccountQueries.list(filter).queryKey).toEqual(["bank-accounts", "list", filter]);
  });
});
