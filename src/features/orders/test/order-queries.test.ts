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
});
