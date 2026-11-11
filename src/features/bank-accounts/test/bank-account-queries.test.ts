import { describe, expect, it } from "vitest";
import { bankAccountQueries, parseBankAccountSearchParams } from "../bank-account-queries";

describe("bank account search params", () => {
  it("falls back to safe defaults for invalid values", () => {
    expect(parseBankAccountSearchParams({ page: "0", pageSize: "500", linkStatus: "WRONG", status: ["ACTIVE"] }))
      .toEqual({ page: 1, pageSize: 10 });
  });

  it("keeps valid filters", () => {
    expect(parseBankAccountSearchParams({ page: "3", pageSize: "20", linkStatus: "LINKED", status: "INACTIVE" }))
      .toEqual({ page: 3, pageSize: 20, linkStatus: "LINKED", status: "INACTIVE" });
  });

  // Lọc theo Sub (11/11/2026): BE đã nhận subMerchantId; URL chỉ giữ một UUID hợp lệ.
  it("reads the Sub-merchant filter from the URL and drops an invalid id", () => {
    const sub = "77777777-7777-4777-8777-777777777777";
    expect(parseBankAccountSearchParams({ subMerchantId: sub })).toEqual({ page: 1, pageSize: 10, subMerchantId: sub });
    expect(parseBankAccountSearchParams({ subMerchantId: "not-an-id" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("puts every filter and the Master into the query key", () => {
    const filter = { page: 2, pageSize: 10, merchantId: "m1", linkStatus: "LINKED" as const };
    expect(bankAccountQueries.list(filter).queryKey).toEqual(["bank-accounts", "list", filter]);
  });
});
