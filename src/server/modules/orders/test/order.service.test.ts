import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { cancelOrder, createOrder, getOrder, listOrders, refreshOrderQr } from "../order.service";

const base = "https://merchant.test";
const path = `${base}/api/v1/merchant/orders`;
const merchantId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const order = {
  id,
  merchantId,
  orderCode: "INV-1",
  amount: 150000,
  currency: "VND",
  status: "ACTIVE",
  bankCode: "VCB",
};
const envelope = (data: unknown) => ({ success: true, data });
const page = (content: unknown[], totalElements = content.length) => ({
  content,
  totalElements,
  totalPages: 1,
  number: 0,
  size: 10,
});

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("order service", () => {
  it("sends only the filters BE supports (no merchantId) and maps Page", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([order], 17)));
    }));
    const result = await listOrders({ page: 2, pageSize: 10, orderCode: "INV", status: "ACTIVE" });
    expect(result).toMatchObject({ success: true, data: { rows: [order], total: 17 } });
    expect(Object.fromEntries(query!)).toEqual({
      page: "2",
      size: "10",
      orderCode: "INV",
      status: "ACTIVE",
    });
  });

  it("forwards the Sub-merchant and created-date filters", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([])));
    }));
    await listOrders({
      page: 1, pageSize: 10, subMerchantIds: ["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"],
      createdFrom: "2026-10-01", createdTo: "2026-10-09",
    });
    expect(Object.fromEntries(query!)).toMatchObject({
      subMerchantIds: "11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222", createdFrom: "2026-10-01", createdTo: "2026-10-09",
    });
  });

  it("maps an empty Page", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json(envelope(page([], 0)))));
    expect(await listOrders({ page: 1, pageSize: 10 })).toEqual({
      success: true,
      data: { rows: [], total: 0 },
    });
  });

  it("preserves 403 and rejects a malformed response", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: "Cấm truy cập" }, { status: 403 })));
    expect(await listOrders({ page: 1, pageSize: 10 })).toMatchObject({
      success: false,
      error: { status: 403 },
    });
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope({ id, status: "PAID" }))));
    expect(await getOrder(id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("encodes the id in the detail path", async () => {
    let requested = "";
    mswServer.use(http.get(`${path}/*`, ({ request }) => {
      requested = new URL(request.url).pathname;
      return HttpResponse.json(envelope(order));
    }));
    await getOrder("a/b");
    expect(requested).toBe("/api/v1/merchant/orders/a%2Fb");
  });

  it("creates with the mapped body and the session merchant", async () => {
    let body: unknown;
    mswServer.use(http.post(path, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(order));
    }));
    const values = { orderCode: "INV-1", amount: 150000, currency: "VND" as const, bankCode: "VCB" as const, paymentMethod: "QR" as const };
    expect(await createOrder(values, merchantId)).toMatchObject({ success: true });
    expect(body).toEqual({ ...values, merchantId });
  });

  it("refreshes the QR without a body", async () => {
    let refreshBody: string | undefined;
    mswServer.use(http.post(`${path}/${id}/refresh-qr`, async ({ request }) => {
      refreshBody = await request.text();
      return HttpResponse.json(envelope(order));
    }));
    expect(await refreshOrderQr(id)).toMatchObject({ success: true });
    expect(refreshBody).toBe("");
  });

  it("cancels through the cancel path without a body", async () => {
    let cancelBody: string | undefined;
    mswServer.use(http.post(`${path}/${id}/cancel`, async ({ request }) => {
      cancelBody = await request.text();
      return HttpResponse.json(envelope({ ...order, status: "CANCELLED", qrCode: null }));
    }));
    expect(await cancelOrder(id)).toMatchObject({ success: true, data: { status: "CANCELLED" } });
    expect(cancelBody).toBe("");
  });

  it("keeps the BE error name of a refused cancel", async () => {
    mswServer.use(http.post(`${path}/${id}/cancel`, () =>
      HttpResponse.json({ success: false, message: "MERCHANT_ORDER_BANK_CANCEL_REJECTED", detail: "x" }, { status: 409 })));
    expect(await cancelOrder(id)).toMatchObject({ success: false, error: { status: 409, code: "MERCHANT_ORDER_BANK_CANCEL_REJECTED" } });
  });

  it("accepts the merchant portal order shape without accounting fields", async () => {
    const portal = { ...order, subMerchantId: "11111111-1111-4111-8111-111111111111", terminalId: null, feeAmount: 500 };
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope(portal))));
    const result = await getOrder(id);
    expect(result).toMatchObject({ success: true, data: { subMerchantId: portal.subMerchantId, feeAmount: 500 } });
  });
});
