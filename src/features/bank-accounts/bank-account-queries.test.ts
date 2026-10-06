import { describe, expect, it } from "vitest";
import { bankAccountQueries, parseBankAccountSearchParams } from "./bank-account-queries";

describe("bank account search params", () => {
  it("falls back to safe defaults for invalid values", () => {
    expect(parseBankAccountSearchParams({ page: "0", pageSize: "500", linkStatus: "WRONG", status: ["ACTIVE"] }))
      .toEqual({ page: 1, pageSize: 10 });
  });

  it("keeps valid filters", () => {
    expect(parseBankAccountSearchParams({ page: "3", pageSize: "20", linkStatus: "LINKED", status: "INACTIVE" }))
      .toEqual({ page: 3, pageSize: 20, linkStatus: "LINKED", status: "INACTIVE" });
  });

  it("puts every filter and the Master into the query key", () => {
    const filter = { page: 2, pageSize: 10, merchantId: "m1", linkStatus: "LINKED" as const };
    expect(bankAccountQueries.list(filter).queryKey).toEqual(["bank-accounts", "list", filter]);
  });
});
