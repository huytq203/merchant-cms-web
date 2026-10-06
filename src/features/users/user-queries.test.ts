import { describe, expect, it } from "vitest";
import { parseUserSearchParams, userQueries } from "./user-queries";

const merchantA = "11111111-1111-4111-8111-111111111111";
const merchantB = "22222222-2222-4222-8222-222222222222";

describe("user queries", () => {
  it("keys the list by every filter field and keeps it fresh for 30 seconds", () => {
    const filter = { page: 1, pageSize: 10, query: "test" };
    expect(userQueries.list(filter).queryKey).toEqual(["users", "list", filter]);
    expect(userQueries.list({ ...filter, page: 2 }).queryKey).not.toEqual(userQueries.list(filter).queryKey);
    expect(userQueries.list(filter).staleTime).toBe(30_000);
  });

  it("accepts bounded query, known status, and owned merchant when there are multiple masters", () => {
    expect(parseUserSearchParams({ query: "  test ", status: "ACTIVE", merchantId: merchantB }, [merchantA, merchantB])).toMatchObject({
      query: "test", status: "ACTIVE", merchantId: merchantB,
    });
  });

  it("ignores unknown status, long query, and merchant selection for a single master", () => {
    expect(parseUserSearchParams({ query: "x".repeat(101), status: "UNKNOWN", merchantId: merchantB }, [merchantA])).toEqual({ page: 1, pageSize: 10 });
  });
});
