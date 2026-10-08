import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { createSubMerchant, getSubMerchant, listSubMerchants, lockSubMerchant, unlockSubMerchant, updateSubMerchant } from "../sub-merchant.service";

const BASE = "https://merchant.test";
const PATH = `${BASE}/api/v1/merchant/sub-merchants`;
const LIST_PATH = PATH;
const merchantId = "11111111-1111-4111-8111-111111111111";
const detail = { id: "22222222-2222-4222-8222-222222222222", merchantId, code: "SUB", name: "Điểm bán", status: "ACTIVE", isDefault: false, taxCodeEditable: true, phone: { value: null, source: null, inherited: true, suspended: false }, address: { value: null, source: null, inherited: true, suspended: false } };
const row = { id: detail.id, merchantId, code: detail.code, name: detail.name, status: detail.status, isDefault: false };
const values = { name: " Điểm bán ", businessField: "", inheritPhone: true, phone: "", inheritAddress: false, address: "Hà Nội" };
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[], totalElements = content.length) => ({ content, totalElements, totalPages: 1, number: 0, size: 10 });

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", BASE);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("sub merchant service", () => {
  it("sends one-based pagination to the merchant endpoint and maps Page", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(LIST_PATH, ({ request }) => { query = new URL(request.url).searchParams; return HttpResponse.json(envelope(page([row], 17))); }));
    expect(await listSubMerchants({ page: 2, pageSize: 10, keyword: "Điểm", status: "ACTIVE" })).toEqual({ success: true, data: { rows: [expect.objectContaining(row)], total: 17 } });
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "10" });
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
    expect(body).toEqual({ merchantId, name: "Điểm bán", inheritPhone: true, inheritAddress: false, address: "Hà Nội" });
  });
  it("updates with PUT without merchantId", async () => {
    let body: unknown;
    mswServer.use(http.put(`${PATH}/${detail.id}`, async ({ request }) => { body = await request.json(); return HttpResponse.json(envelope(detail)); }));
    expect(await updateSubMerchant(detail.id, values)).toMatchObject({ success: true });
    expect(body).toEqual({ name: "Điểm bán", inheritPhone: true, inheritAddress: false, address: "Hà Nội" });
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
