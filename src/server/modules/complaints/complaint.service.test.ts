import { afterEach, describe, expect, it, vi } from "vitest";
import { listComplaints } from "./complaint.service";

const merchantId = "22222222-2222-4222-8222-222222222222";
const base = { page: 1, pageSize: 10, merchantId };

function useFixtureMode() {
  vi.stubEnv("MERCHANT_API_MODE", "fixture");
  vi.stubEnv("NODE_ENV", "development");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listComplaints in fixture mode", () => {
  it("pages the sample data and reports the total", async () => {
    useFixtureMode();
    const first = await listComplaints({ ...base, pageSize: 4 });
    const second = await listComplaints({ ...base, pageSize: 4, page: 2 });
    if (!first.success || !second.success) throw new Error("expected success");
    expect(first.data.rows).toHaveLength(4);
    expect(first.data.total).toBeGreaterThan(4);
    expect(second.data.rows[0]?.id).not.toBe(first.data.rows[0]?.id);
  });

  it("applies the filters and returns an empty page when nothing matches", async () => {
    useFixtureMode();
    const gateway = await listComplaints({ ...base, source: "gateway", status: "processing" });
    if (!gateway.success) throw new Error("expected success");
    expect(gateway.data.rows.length).toBeGreaterThan(0);
    expect(gateway.data.rows.every((row) => row.source === "gateway" && row.status === "processing")).toBe(true);

    const none = await listComplaints({ ...base, keyword: "khong-co-ma-nay" });
    expect(none).toEqual({ success: true, data: { rows: [], total: 0 } });
  });

  it("filters by creation time inclusively", async () => {
    useFixtureMode();
    const all = await listComplaints({ ...base, pageSize: 100 });
    if (!all.success) throw new Error("expected success");
    const target = all.data.rows[2]!;
    const only = await listComplaints({ ...base, createdFromDate: target.createdAt, createdToDate: target.createdAt });
    if (!only.success) throw new Error("expected success");
    expect(only.data.rows.map((row) => row.id)).toEqual([target.id]);
  });
});

describe("listComplaints without a BE API", () => {
  it("answers NOT_IMPLEMENTED 501 in live mode", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "live");
    vi.stubEnv("NODE_ENV", "development");
    const result = await listComplaints(base);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(501);
      expect(result.error.code).toBe("NOT_IMPLEMENTED");
    }
  });

  it("never serves fixtures in production, even when the environment says fixture", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "production");
    expect((await listComplaints(base)).success).toBe(false);
  });
});
