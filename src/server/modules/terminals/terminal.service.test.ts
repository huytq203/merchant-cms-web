import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { createTerminal, getTerminal, listTerminals, lockTerminal, unlockTerminal, updateTerminal } from "./terminal.service";

const base = "https://merchant.test";
const path = `${base}/api/v1/merchant/terminals`;
const subMerchantId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const contactPhone = { value: null, source: null, inherited: true, suspended: false };
const row = { id, tid: "TML000001", name: "Quầy 1", terminalType: "POS", address: "Hà Nội", status: "ACTIVE", subMerchantId, merchantId, contactPhone };
const detail = { ...row, merchantCode: "M01", contactPerson: null, note: null, typeChangeWarning: null, updatedAt: null };
const values = { subMerchantId, name: "Quầy 1", terminalType: "POS" as const, address: "Hà Nội", contactPerson: "", inheritContactPhone: true, contactPhone: "", note: "" };
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[], totalElements = content.length) => ({ content, totalElements, totalPages: 1, number: 0, size: 10 });

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("terminal service", () => {
  it("sends filters and maps Page", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([row], 17)));
    }));
    expect(await listTerminals({ page: 2, pageSize: 10, subMerchantId, name: "Quầy", status: "ACTIVE" }))
      .toMatchObject({ success: true, data: { rows: [row], total: 17 } });
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "10", subMerchantId, name: "Quầy", status: "ACTIVE" });
  });

  it("maps an empty Page", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json(envelope(page([], 0)))));
    expect(await listTerminals({ page: 1, pageSize: 10, subMerchantId })).toEqual({ success: true, data: { rows: [], total: 0 } });
  });

  it("preserves 403 and rejects malformed response", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: "Cấm truy cập" }, { status: 403 })));
    expect(await listTerminals({ page: 1, pageSize: 10 })).toMatchObject({ success: false, error: { status: 403 } });
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope({ id }))));
    expect(await getTerminal(id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("creates and updates with mapped body", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.post(path, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(envelope(detail));
    }));
    mswServer.use(http.put(`${path}/${id}`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json(envelope(detail));
    }));
    expect(await createTerminal(values)).toMatchObject({ success: true });
    expect(await updateTerminal(id, values)).toMatchObject({ success: true });
    expect(bodies[0]).toMatchObject({ subMerchantId, name: "Quầy 1", terminalType: "POS", address: "Hà Nội" });
    expect(bodies[1]).not.toHaveProperty("subMerchantId");
  });

  it.each(["lock", "unlock"] as const)("posts a reason to %s", async (action) => {
    let body: unknown;
    mswServer.use(http.post(`${path}/${id}/${action}`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(detail));
    }));
    const result = await (action === "lock" ? lockTerminal : unlockTerminal)(id, "Lý do hợp lệ");
    expect(result).toMatchObject({ success: true });
    expect(body).toEqual({ reason: "Lý do hợp lệ" });
  });
});
