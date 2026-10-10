import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { createSubMerchant, getSubMerchant, listSubMerchants, lockSubMerchant, unlockSubMerchant, updateSubMerchant } from "../sub-merchant.service";

const BASE = "https://merchant.test";
const PATH = `${BASE}/api/v1/merchant/sub-merchants`;
const LIST_PATH = PATH;
const merchantId = "11111111-1111-4111-8111-111111111111";
const detail = { id: "22222222-2222-4222-8222-222222222222", merchantId, code: "SUB", name: "Sub-merchant", status: "ACTIVE", isDefault: false, taxCodeEditable: true, phone: { value: null, source: null, inherited: true, suspended: false }, address: { value: null, source: null, inherited: true, suspended: false } };
const row = { id: detail.id, merchantId, code: detail.code, name: detail.name, status: detail.status, isDefault: false };
const ids = { a: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", b: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", c: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
const values = { name: " Sub-merchant ", businessField: "", inheritPhone: true, phone: "", inheritAddress: false, address: "Hà Nội" };
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[], totalElements = content.length) => ({ content, totalElements, totalPages: 1, number: 0, size: 10 });

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", BASE);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("sub merchant service", () => {
  it("sends only one-based pagination to the merchant endpoint when no filter is set", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(LIST_PATH, ({ request }) => { query = new URL(request.url).searchParams; return HttpResponse.json(envelope(page([row], 17))); }));
    expect(await listSubMerchants({ page: 2, pageSize: 10 })).toEqual({ success: true, data: { rows: [expect.objectContaining(row)], total: 17 } });
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "10" });
  });
  it("asks the merchant endpoint for one merchant's outlets when a merchant is given", async () => {
    const queries: URLSearchParams[] = [];
    mswServer.use(http.get(LIST_PATH, ({ request }) => { queries.push(new URL(request.url).searchParams); return HttpResponse.json(envelope(page([row], 1))); }));
    await listSubMerchants({ page: 1, pageSize: 10, merchantId });
    await listSubMerchants({ page: 1, pageSize: 10, merchantId, name: "sub" });
    expect(Object.fromEntries(queries[0]!)).toEqual({ page: "1", size: "10", merchantId });
    expect(Object.fromEntries(queries[1]!)).toEqual({ page: "1", size: "100", merchantId });
  });
  it("filters by code, name and status itself, because the merchant endpoint cannot", async () => {
    const outlets = [
      { ...row, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", code: "MC01-S001", name: "Cửa hàng Điện máy", status: "ACTIVE" },
      { ...row, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", code: "MC01-S002", name: "Cửa hàng Thời trang", status: "INACTIVE" },
      { ...row, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", code: "MC01-S003", name: "Kho dien tu", status: "ACTIVE" },
    ];
    const queries: URLSearchParams[] = [];
    mswServer.use(http.get(LIST_PATH, ({ request }) => { queries.push(new URL(request.url).searchParams); return HttpResponse.json(envelope(page(outlets, 3))); }));
    const idsOf = async (filter: Parameters<typeof listSubMerchants>[0]) => {
      const result = await listSubMerchants(filter);
      return result.success ? result.data.rows.map((r) => r.id) : result;
    };
    expect(await idsOf({ page: 1, pageSize: 10, code: "s002" })).toEqual(["bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"]);
    expect(await idsOf({ page: 1, pageSize: 10, name: "dien" })).toEqual([ids.a, ids.c]);
    expect(await idsOf({ page: 1, pageSize: 10, status: "ACTIVE" })).toEqual([ids.a, ids.c]);
    expect(await idsOf({ page: 1, pageSize: 10, name: "cua hang", status: "ACTIVE" })).toEqual(["aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"]);
    expect(Object.fromEntries(queries[0]!)).toEqual({ page: "1", size: "100" });
  });
  it("paginates the filtered rows and reports the filtered total", async () => {
    const outlets = ["1", "2", "3"].map((n) => ({ ...row, id: `${n}0000000-0000-4000-8000-000000000000`, code: `S00${n}`, name: "Outlet" }));
    mswServer.use(http.get(LIST_PATH, () => HttpResponse.json(envelope(page(outlets, 3)))));
    const second = await listSubMerchants({ page: 2, pageSize: 2, name: "outlet" });
    expect(second).toMatchObject({ success: true, data: { total: 3 } });
    expect(second.success && second.data.rows.map((r) => r.id)).toEqual(["30000000-0000-4000-8000-000000000000"]);
  });
  it("reads every page of assigned outlets before filtering", async () => {
    const seen: string[] = [];
    mswServer.use(http.get(LIST_PATH, ({ request }) => {
      const pageNo = new URL(request.url).searchParams.get("page") ?? "1";
      seen.push(pageNo);
      return HttpResponse.json(envelope({ ...page([{ ...row, id: `${pageNo}0000000-0000-4000-8000-000000000000`, code: `S${pageNo}` }], 2), totalPages: 2 }));
    }));
    const result = await listSubMerchants({ page: 1, pageSize: 10, code: "s" });
    expect(seen).toEqual(["1", "2"]);
    expect(result.success && result.data.rows.map((r) => r.id)).toEqual(["10000000-0000-4000-8000-000000000000", "20000000-0000-4000-8000-000000000000"]);
  });
  it("maps an empty Page", async () => {
    mswServer.use(http.get(LIST_PATH, () => HttpResponse.json(envelope(page([], 0)))));
    expect(await listSubMerchants({ page: 1, pageSize: 10 })).toEqual({ success: true, data: { rows: [], total: 0 } });
  });
  it("preserves a BE 403", async () => {
    mswServer.use(http.get(LIST_PATH, () => HttpResponse.json({ success: false, message: "Cấm truy cập" }, { status: 403 })));
    const result = await listSubMerchants({ page: 1, pageSize: 10 });
    expect(result).toMatchObject({ success: false, error: { status: 403 } });
  });
  it("creates with the mapped body", async () => {
    let body: unknown;
    mswServer.use(http.post(PATH, async ({ request }) => { body = await request.json(); return HttpResponse.json(envelope(detail)); }));
    expect(await createSubMerchant(values, merchantId)).toMatchObject({ success: true, data: detail });
    expect(body).toEqual({ merchantId, name: "Sub-merchant", inheritPhone: true, inheritAddress: false, address: "Hà Nội" });
  });
  it("updates with PUT without merchantId", async () => {
    let body: unknown;
    mswServer.use(http.put(`${PATH}/${detail.id}`, async ({ request }) => { body = await request.json(); return HttpResponse.json(envelope(detail)); }));
    expect(await updateSubMerchant(detail.id, values)).toMatchObject({ success: true });
    expect(body).toEqual({ name: "Sub-merchant", inheritPhone: true, inheritAddress: false, address: "Hà Nội" });
  });
  it.each(["lock", "unlock"] as const)("posts a reason to %s", async (action) => {
    let body: unknown;
    mswServer.use(http.post(`${PATH}/${detail.id}/${action}`, async ({ request }) => { body = await request.json(); return HttpResponse.json(envelope(detail)); }));
    const result = await (action === "lock" ? lockSubMerchant : unlockSubMerchant)(detail.id, "Lý do hợp lệ");
    expect(result).toMatchObject({ success: true });
    expect(body).toEqual({ reason: "Lý do hợp lệ" });
  });
  it("rejects a detail missing status", async () => {
    const { status, ...invalid } = detail;
    void status;
    mswServer.use(http.get(`${PATH}/${detail.id}`, () => HttpResponse.json(envelope(invalid))));
    expect(await getSubMerchant(detail.id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });
});
