import { describe, expect, it } from "vitest";
import { parseRefundSearchParams, refundQueries, toRefundSearchParams } from "./refund-queries";

describe("parseRefundSearchParams", () => {
  it("falls back to the first page of ten rows and ignores invalid input", () => {
    expect(parseRefundSearchParams({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseRefundSearchParams({ pageSize: "500", status: "unknown" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("reads the filters from the URL and round-trips them", () => {
    const filter = { page: 2, pageSize: 20, status: ["pending", "cancelled"] as ("pending" | "cancelled")[], keyword: "REF" };
    const params = toRefundSearchParams(filter);
    expect(params.get("invoiceCode")).toBeNull();
    expect(parseRefundSearchParams(Object.fromEntries(params))).toEqual(filter);
  });

  it("round-trips two selected statuses", () => {
    const filter = { page: 1, pageSize: 10, status: ["pending", "cancelled"] as ("pending" | "cancelled")[] };
    const params = toRefundSearchParams(filter);
    expect(params.get("status")).toBe("pending,cancelled");
    expect(parseRefundSearchParams(Object.fromEntries(params)).status).toEqual(filter.status);
  });
});

describe("refundQueries.list", () => {
  it("puts the whole filter in the query key", () => {
    const a = refundQueries.list({ page: 1, pageSize: 10 });
    const b = refundQueries.list({ page: 1, pageSize: 10, status: ["pending"] });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });
});
