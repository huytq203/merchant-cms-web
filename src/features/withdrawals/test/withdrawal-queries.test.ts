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
    const subs = ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"];
    expect(toWithdrawalSearchParams({ ...filter, subMerchantIds: subs }).get("subMerchantIds")).toBe(subs.join(","));
    expect(parseWithdrawalSearchParams({ subMerchantIds: subs.join(",") })).toMatchObject({ subMerchantIds: subs });
    expect(toWithdrawalSearchParams(filter).toString())
      .toBe("page=2&pageSize=20&transactionCode=WD&status=COMPLETED&createdFrom=2026-01-01");
    expect(withdrawalQueries.list(filter).queryKey).toEqual(["withdrawals", "list", filter]);
    expect(withdrawalQueries.list({ ...filter, page: 3 }).queryKey).not.toEqual(withdrawalQueries.list(filter).queryKey);
  });

  it("keys the balance by Sub, and asks nothing until a Sub is chosen", () => {
    expect(withdrawalQueries.balance("a").queryKey).toEqual(["withdrawals", "balance", "a", ""]);
    expect(withdrawalQueries.balance("a").queryKey).not.toEqual(withdrawalQueries.balance("b").queryKey);
    expect(withdrawalQueries.balance("a").enabled).toBe(true);
    expect(withdrawalQueries.balance("").enabled).toBe(false);
  });

  it("keys the balance by the chosen account too, so changing the account prices the fee again", () => {
    expect(withdrawalQueries.balance("a", "acc-1").queryKey).toEqual(["withdrawals", "balance", "a", "acc-1"]);
    expect(withdrawalQueries.balance("a", "acc-1").queryKey).not.toEqual(withdrawalQueries.balance("a", "acc-2").queryKey);
    // Danh sách TK chưa về thì chưa hỏi (tránh một lần hỏi thừa không có TK).
    expect(withdrawalQueries.balance("a", "", false).enabled).toBe(false);
  });

  it("keys bank options by sub-merchant so a change refetches", () => {
    expect(withdrawalQueries.bankOptions("a").queryKey).not.toEqual(withdrawalQueries.bankOptions("b").queryKey);
    // Chưa chọn Sub thì không gọi, để không trộn tài khoản của nhiều Sub.
    expect(withdrawalQueries.bankOptions("").enabled).toBe(false);
    expect(withdrawalQueries.bankOptions("a").enabled).toBe(true);
  });
});
