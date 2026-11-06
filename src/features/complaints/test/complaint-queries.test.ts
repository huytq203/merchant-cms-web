import { describe, expect, it } from "vitest";
import { complaintPath, complaintQueries, parseComplaintSearchParams, toComplaintSearchParams } from "../complaint-queries";

describe("parseComplaintSearchParams", () => {
  it("falls back to the first page of ten rows and ignores invalid input", () => {
    expect(parseComplaintSearchParams({})).toEqual({ page: 1, pageSize: 10 });
    expect(parseComplaintSearchParams({ pageSize: "500" })).toEqual({ page: 1, pageSize: 10 });
    expect(parseComplaintSearchParams({ status: "processing" })).toEqual({ page: 1, pageSize: 10 });
    expect(parseComplaintSearchParams({ createdFrom: "2026-11-05", createdTo: "2026-11-01" })).toEqual({ page: 1, pageSize: 10 });
  });

  it("reads the filters from the URL and round-trips them", () => {
    const filter = {
      page: 2,
      pageSize: 20,
      status: "PROCESSING" as const,
      waitingOn: "MERCHANT" as const,
      reporterType: "ADMIN" as const,
      createdFrom: "2026-11-01",
    };
    const params = toComplaintSearchParams(filter);
    expect(params.get("keyword")).toBeNull();
    expect(parseComplaintSearchParams(Object.fromEntries(params))).toEqual(filter);
  });
});

describe("complaintQueries", () => {
  it("puts the whole filter in the list key", () => {
    const a = complaintQueries.list({ page: 1, pageSize: 10 });
    const b = complaintQueries.list({ page: 1, pageSize: 10, status: "WAITING" });
    expect(a.queryKey).not.toEqual(b.queryKey);
  });

  it("shares the complaints prefix between list and detail so one invalidation refreshes both", () => {
    expect(complaintQueries.list({ page: 1, pageSize: 10 }).queryKey[0]).toBe("complaints");
    expect(complaintQueries.detail("x").queryKey).toEqual(["complaints", "detail", "x"]);
  });

  it("encodes path segments", () => {
    expect(complaintPath("a/b", "attachments", "c", "link")).toBe("/v1/admin/merchants/complaints/a%2Fb/attachments/c/link");
  });
});
