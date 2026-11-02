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
      status: "SUCCESS",
      keyword: "  FM26  ",
      paymentMethod: "QR",
      subMerchantId: "5dcda5e6-afd1-4201-a02f-7187164f0f86",
      createdFrom: "2026-11-01",
      createdTo: "2026-11-02",
    });
    expect(filter).toEqual({
      page: 3,
      pageSize: 50,
      status: "SUCCESS",
      keyword: "FM26",
      paymentMethod: "QR",
      subMerchantId: "5dcda5e6-afd1-4201-a02f-7187164f0f86",
      createdFrom: "2026-11-01",
      createdTo: "2026-11-02",
    });
  });

  it("ignores invalid input instead of failing the page", () => {
    expect(parseTransactionSearchParams({ pageSize: "500", status: "PAID" })).toEqual({ page: 1, pageSize: 10 });
    // Old fixture values and a reversed range are not BE filters.
    expect(parseTransactionSearchParams({ status: "success" })).toEqual({ page: 1, pageSize: 10 });
    expect(parseTransactionSearchParams({ createdFrom: "2026-11-02", createdTo: "2026-11-01" })).toEqual({
      page: 1,
      pageSize: 10,
    });
    expect(parseTransactionSearchParams({ page: ["1", "2"], keyword: ["a"] })).toEqual({ page: 1, pageSize: 10 });
  });
});

describe("toTransactionSearchParams", () => {
  it("round-trips the filter through the URL and skips empty values", () => {
    const filter = { page: 2, pageSize: 20, status: "EXPIRED" as const, paymentMethod: "VIRTUAL_ACCOUNT" as const };
    const params = toTransactionSearchParams(filter);
    expect(params.get("keyword")).toBeNull();
    expect(parseTransactionSearchParams(Object.fromEntries(params))).toEqual(filter);
  });
});

describe("transactionQueries.list", () => {
  it("puts the whole filter in the query key", () => {
    const a = transactionQueries.list({ page: 1, pageSize: 10 });
    const b = transactionQueries.list({ page: 1, pageSize: 10, status: "FAILED" });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });
});
