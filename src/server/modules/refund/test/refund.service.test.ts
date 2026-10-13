import { afterEach, describe, expect, it, vi } from "vitest";
import { listRefunds } from "../refund.service";

const merchantId = "22222222-2222-4222-8222-222222222222";
const base = { page: 1, pageSize: 10, merchantId };

function useFixtureMode() {
  vi.stubEnv("MERCHANT_API_MODE", "fixture");
  vi.stubEnv("NODE_ENV", "development");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("listRefunds in fixture mode", () => {
  it("pages the sample data and reports the total", async () => {
    useFixtureMode();
    const first = await listRefunds({ ...base, pageSize: 5 });
    const second = await listRefunds({ ...base, pageSize: 5, page: 2 });
    if (!first.success || !second.success) throw new Error("expected success");
    expect(first.data.rows).toHaveLength(5);
    expect(first.data.total).toBeGreaterThan(5);
    expect(second.data.rows[0]?.id).not.toBe(first.data.rows[0]?.id);
  });

  it("applies the filters and returns an empty page when nothing matches", async () => {
    useFixtureMode();
    const pending = await listRefunds({ ...base, status: ["pending"] });
    if (!pending.success) throw new Error("expected success");
    expect(pending.data.rows.length).toBeGreaterThan(0);
    expect(pending.data.rows.every((row) => row.status === "pending")).toBe(true);

    const none = await listRefunds({ ...base, keyword: "khong-co-ma-nay" });
    expect(none).toEqual({ success: true, data: { rows: [], total: 0 } });
  });

  it("finds a refund by its code, its transaction code or its invoice code with one keyword", async () => {
    useFixtureMode();
    const all = await listRefunds({ ...base, pageSize: 100 });
    if (!all.success) throw new Error("expected success");
    const sample = all.data.rows.find((row) => row.invoiceCode);
    if (!sample?.invoiceCode) throw new Error("expected a row with an invoice code");
    for (const keyword of [sample.code, sample.transactionCode, sample.invoiceCode]) {
      const found = await listRefunds({ ...base, keyword });
      if (!found.success) throw new Error("expected success");
      expect(found.data.rows.map((row) => row.id)).toContain(sample.id);
    }
  });

  it("ignores a BE sub-merchant id because sample ids are not BE ids", async () => {
    useFixtureMode();
    const all = await listRefunds({ ...base, pageSize: 100 });
    const byBeId = await listRefunds({ ...base, pageSize: 100, subMerchantId: "00000000-0000-4000-8000-000000000001" });
    if (!all.success || !byBeId.success) throw new Error("expected success");
    expect(byBeId.data.total).toBe(all.data.total);
  });

  it("filters by creation time inclusively", async () => {
    useFixtureMode();
    const all = await listRefunds({ ...base, pageSize: 100 });
    if (!all.success) throw new Error("expected success");
    const target = all.data.rows[2]!;
    const only = await listRefunds({ ...base, createdFromDate: target.createdAt, createdToDate: target.createdAt });
    if (!only.success) throw new Error("expected success");
    expect(only.data.rows.map((row) => row.id)).toEqual([target.id]);
  });
});

describe("listRefunds without a BE API", () => {
  it("answers NOT_IMPLEMENTED 501 in live mode", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "live");
    vi.stubEnv("NODE_ENV", "development");
    const result = await listRefunds(base);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(501);
      expect(result.error.code).toBe("NOT_IMPLEMENTED");
    }
  });

  it("never serves fixtures in production, even when the environment says fixture", async () => {
    vi.stubEnv("MERCHANT_API_MODE", "fixture");
    vi.stubEnv("NODE_ENV", "production");
    expect((await listRefunds(base)).success).toBe(false);
  });
});
