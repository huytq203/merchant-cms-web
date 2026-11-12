import { describe, expect, it } from "vitest";
import { orderQueries, parseOrderSearchParams, toOrderSearchParams } from "../order-queries";

describe("order search params", () => {
  it("falls back to safe defaults for malformed input", () => {
    expect(parseOrderSearchParams({ page: "0", pageSize: "500", status: "PAID", orderCode: "  " }))
      .toEqual({ page: 1, pageSize: 10 });
  });

  it("keeps a valid status, trimmed code and pagination", () => {
    expect(parseOrderSearchParams({ page: "3", pageSize: "50", status: "ACTIVE", orderCode: " INV " }))
      .toEqual({ page: 3, pageSize: 50, status: "ACTIVE", orderCode: "INV" });
  });

  it("puts every filter into the URL and the query key", () => {
    const filter = { page: 2, pageSize: 20, status: "SUCCESS", orderCode: "INV" } as const;
    expect(toOrderSearchParams(filter).toString()).toBe("page=2&pageSize=20&orderCode=INV&status=SUCCESS");
    expect(orderQueries.list(filter).queryKey).toEqual(["orders", "list", filter]);
    expect(orderQueries.list({ ...filter, page: 3 }).queryKey).not.toEqual(orderQueries.list(filter).queryKey);
  });

  it("round-trips the Sub-merchant and created-date filters through the URL", () => {
    const filter = {
      page: 1, pageSize: 10, subMerchantIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
      createdFrom: "2026-10-01", createdTo: "2026-10-09",
    };
    const params = toOrderSearchParams(filter);
    expect(parseOrderSearchParams(Object.fromEntries(params))).toEqual(filter);
  });

  it("writes several Subs as one comma-joined subMerchantIds param and still reads the old subMerchantId", () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    expect(toOrderSearchParams({ page: 1, pageSize: 10, subMerchantIds: [a, b] }).get("subMerchantIds")).toBe(`${a},${b}`);
    expect(parseOrderSearchParams({ subMerchantId: a })).toMatchObject({ subMerchantIds: [a] });
    expect(toOrderSearchParams({ page: 1, pageSize: 10, subMerchantIds: [] }).has("subMerchantIds")).toBe(false);
  });

  it("drops a malformed Sub-merchant id or date instead of sending it on", () => {
    expect(parseOrderSearchParams({ subMerchantIds: "abc,", createdFrom: "09/10/2026", createdTo: "2026-13-40" }))
      .toEqual({ page: 1, pageSize: 10 });
  });
});
