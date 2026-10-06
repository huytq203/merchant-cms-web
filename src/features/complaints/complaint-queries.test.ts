import { describe, expect, it } from "vitest";
import { complaintQueries, parseComplaintSearchParams, toComplaintSearchParams } from "./complaint-queries";

describe("parseComplaintSearchParams", () => {
  it("falls back to the first page of ten rows and ignores invalid input", () => {
    expect(parseComplaintSearchParams({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseComplaintSearchParams({ pageSize: "500", source: "bank" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("reads the filters from the URL and round-trips them", () => {
    const filter = { page: 2, pageSize: 20, status: "processing" as const, source: "gateway" as const };
    const params = toComplaintSearchParams(filter);
    expect(params.get("keyword")).toBeNull();
    expect(parseComplaintSearchParams(Object.fromEntries(params))).toEqual(filter);
  });
});

describe("complaintQueries.list", () => {
  it("puts the whole filter in the query key", () => {
    const a = complaintQueries.list({ page: 1, pageSize: 10 });
    const b = complaintQueries.list({ page: 1, pageSize: 10, status: "pending" });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });
});
