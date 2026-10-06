import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  checkAvailability,
  getMerchantStatusHistory,
  getMerchant,
  getWallet,
  submitWallet,
  updateMerchant,
  updateWallet,
  uploadDocument,
} from "./kyb.service";

const BASE = "https://merchant.test";
const walletId = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const envelope = (data: unknown) => ({ success: true, data });
const wallet = { id: walletId, registeredEmail: "owner@example.com", verificationStatus: "DRAFT" };

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", BASE);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("KYB service", () => {
  it("uploads multipart with document type and file", async () => {
    let receivedType: FormDataEntryValue | null = null;
    let receivedFile: FormDataEntryValue | null = null;
    mswServer.use(http.post(`${BASE}/api/v1/admin/documents`, async ({ request }) => {
      const body = await request.formData();
      receivedType = body.get("documentType");
      receivedFile = body.get("file");
      return HttpResponse.json(envelope({ stagingId: walletId }));
    }));
    const file = new File(["pdf"], "license.pdf", { type: "application/pdf" });
    expect(await uploadDocument(file, "BUSINESS_LICENSE")).toMatchObject({ success: true });
    expect(receivedType).toBe("BUSINESS_LICENSE");
    expect(receivedFile).toMatchObject({ name: "license.pdf", type: "application/pdf" });
  });
  it("submits without a request body", async () => {
    let body: string | undefined;
    mswServer.use(http.post(`${BASE}/api/v1/admin/enterprise-wallets/${walletId}/submit`, async ({ request }) => {
      body = await request.text();
      return HttpResponse.json(envelope(wallet));
    }));
    expect(await submitWallet(walletId)).toMatchObject({ success: true });
    expect(body).toBe("");
  });
  it("maps an empty status history Page", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/admin/merchants/${merchantId}/status-history`, () =>
      HttpResponse.json(envelope({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }))));
    expect(await getMerchantStatusHistory(merchantId, 1)).toEqual({ success: true, data: { rows: [], total: 0 } });
  });
  it("preserves duplicate email feedback", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/admin/enterprise-wallets/availability`, () =>
      HttpResponse.json({ success: false, message: "Email đã tồn tại" }, { status: 409 })));
    expect(await checkAvailability({ email: "owner@example.com", taxCode: "0123456789" }))
      .toMatchObject({ success: false, error: { status: 409, message: "Email đã tồn tại" } });
  });
  it("rejects an invalid wallet response", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/admin/enterprise-wallets/${walletId}`, () =>
      HttpResponse.json(envelope({ ...wallet, verificationStatus: "UNKNOWN" }))));
    expect(await getWallet(walletId)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });
  it("sends the availability query with the BE parameter names", async () => {
    let query: Record<string, string> = {};
    mswServer.use(http.get(`${BASE}/api/v1/admin/enterprise-wallets/availability`, ({ request }) => {
      query = Object.fromEntries(new URL(request.url).searchParams);
      return HttpResponse.json(envelope({ emailAvailable: true, taxCodeUsedBy: [] }));
    }));
    expect(await checkAvailability({ email: "owner@example.com", taxCode: "0123456789" }))
      .toMatchObject({ success: true, data: { emailAvailable: true } });
    expect(query).toEqual({ registeredEmail: "owner@example.com", taxCode: "0123456789" });
  });
  it("updates a wallet without the registered email", async () => {
    let body: Record<string, unknown> = {};
    mswServer.use(http.put(`${BASE}/api/v1/admin/enterprise-wallets/${walletId}`, async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json(envelope(wallet));
    }));
    await updateWallet(walletId, { registeredEmail: "owner@example.com", legalName: "Công ty A", internalWallet: false });
    expect(body).toEqual({ legalName: "Công ty A", internalWallet: false });
  });
  it("reads a merchant with its embedded wallet", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/admin/merchants/${merchantId}`, () =>
      HttpResponse.json(envelope({ id: merchantId, status: "DRAFT", enterpriseWallet: { ...wallet, verificationStatus: "VERIFIED" } }))));
    expect(await getMerchant(merchantId)).toMatchObject({
      success: true,
      data: { enterpriseWallet: { verificationStatus: "VERIFIED" } },
    });
  });
  it("updates a merchant without admin password or blank text", async () => {
    let body: Record<string, unknown> = {};
    mswServer.use(http.put(`${BASE}/api/v1/admin/merchants/${merchantId}`, async ({ request }) => {
      body = await request.json() as Record<string, unknown>;
      return HttpResponse.json(envelope({ id: merchantId, status: "DRAFT" }));
    }));
    await updateMerchant(merchantId, {
      mccCode: "5812",
      name: "Quán A",
      websiteUrl: "",
      supportContact: "0912345678",
      productDescription: "",
      contractSignedWithSub: false,
    }, {});
    expect(body).toEqual({ mccCode: "5812", name: "Quán A", supportContact: "0912345678", contractSignedWithSub: false });
  });
});
