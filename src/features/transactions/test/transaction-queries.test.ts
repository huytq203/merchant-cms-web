import { describe, expect, it } from "vitest";
import {
  parseTransactionSearchParams,
  toTransactionSearchParams,
  transactionQueries,
} from "../transaction-queries";

describe("parseTransactionSearchParams", () => {
  it("falls back to the first page of ten rows", () => {
    expect(parseTransactionSearchParams({})).toEqual({ page: 1, pageSize: 10 });
  });

  it("reads the filters from the URL", () => {
    const filter = parseTransactionSearchParams({
      page: "3",
      pageSize: "50",
      status: "failed",
      keyword: "  TRX  ",
      createdFromDate: "2026-09-01T00:00:00.000Z",
    });
    expect(filter).toEqual({
      page: 3,
      pageSize: 50,
      status: "failed",
      keyword: "TRX",
      createdFromDate: "2026-09-01T00:00:00.000Z",
    });
  });

  it("ignores invalid input instead of failing the page", () => {
    expect(parseTransactionSearchParams({ pageSize: "500", status: "PAID" })).toEqual({ page: 1, pageSize: 10 });
    expect(parseTransactionSearchParams({ page: ["1", "2"], keyword: ["a"] })).toEqual({ page: 1, pageSize: 10 });
  });
});

describe("toTransactionSearchParams", () => {
  it("round-trips the filter through the URL and skips empty values", () => {
    const filter = { page: 2, pageSize: 20, status: "success" as const, bankCode: "VCB" };
    const params = toTransactionSearchParams(filter);
    expect(params.get("keyword")).toBeNull();
    expect(parseTransactionSearchParams(Object.fromEntries(params))).toEqual(filter);
  });
});

describe("transactionQueries.list", () => {
  it("puts the whole filter in the query key", () => {
    const a = transactionQueries.list({ page: 1, pageSize: 10 });
    const b = transactionQueries.list({ page: 1, pageSize: 10, status: "failed" });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });
});
