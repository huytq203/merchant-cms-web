import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  getMerchantStatusHistory,
  getMerchant,
  getTaxCodeUsage,
  requestKybOtp,
  submitWallet,
  updateMerchant,
  updateWallet,
  uploadDocument,
} from "../kyb.service";

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
    mswServer.use(http.post(`${BASE}/api/v1/merchant/documents`, async ({ request }) => {
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
  it("submits with the OTP confirmation in the body", async () => {
    let body: unknown;
    mswServer.use(http.post(`${BASE}/api/v1/merchant/merchants/wallets/${walletId}/submit`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(wallet));
    }));
    expect(await submitWallet(walletId, { otpSessionId: "s-1", otp: "123456" })).toMatchObject({ success: true });
    expect(body).toEqual({ otp: { otpSessionId: "s-1", otp: "123456" } });
  });
  it("maps an empty status history Page", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/merchant/merchants/${merchantId}/status-history`, () =>
      HttpResponse.json(envelope({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }))));
    expect(await getMerchantStatusHistory(merchantId, 1)).toEqual({ success: true, data: { rows: [], total: 0 } });
  });
  it("reads which other wallets use a tax code", async () => {
    let query: Record<string, string> = {};
    mswServer.use(http.get(`${BASE}/api/v1/merchant/merchants/wallets/${walletId}/tax-code-usage`, ({ request }) => {
      query = Object.fromEntries(new URL(request.url).searchParams);
      return HttpResponse.json(envelope(["Công ty Khác"]));
    }));
    expect(await getTaxCodeUsage(walletId, "0123456789")).toEqual({ success: true, data: ["Công ty Khác"] });
    expect(query).toEqual({ taxCode: "0123456789" });
  });
  it("asks for a KYB OTP and nothing else", async () => {
    let body: unknown;
    mswServer.use(http.post(`${BASE}/api/v1/merchant/sensitive-operations/otp-challenge`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope({
        otpSessionId: "s-1", maskedRecipient: "ad***@highlands.vn", expiresInSeconds: 300, canResendAfterSeconds: 60,
      }));
    }));
    expect(await requestKybOtp()).toMatchObject({ success: true, data: { otpSessionId: "s-1" } });
    expect(body).toEqual({ operation: "KYB_SUBMIT" });
  });
  it("updates a wallet without the registered email, adding the OTP only when one is given", async () => {
    const bodies: Record<string, unknown>[] = [];
    mswServer.use(http.put(`${BASE}/api/v1/merchant/merchants/wallets/${walletId}`, async ({ request }) => {
      bodies.push(await request.json() as Record<string, unknown>);
      return HttpResponse.json(envelope(wallet));
    }));
    await updateWallet(walletId, { registeredEmail: "owner@example.com", legalName: "Công ty A" });
    await updateWallet(walletId, { legalName: "Công ty A" }, { otpSessionId: "s-1", otp: "123456" });
    expect(bodies).toEqual([
      { legalName: "Công ty A" },
      { legalName: "Công ty A", otp: { otpSessionId: "s-1", otp: "123456" } },
    ]);
  });
  it("reads a merchant with its embedded wallet", async () => {
    mswServer.use(http.get(`${BASE}/api/v1/merchant/merchants/${merchantId}`, () =>
      HttpResponse.json(envelope({ id: merchantId, status: "DRAFT", enterpriseWallet: { ...wallet, verificationStatus: "VERIFIED" } }))));
    expect(await getMerchant(merchantId)).toMatchObject({
      success: true,
      data: { enterpriseWallet: { verificationStatus: "VERIFIED" } },
    });
  });
  it("updates a merchant without admin password or blank text", async () => {
    let body: Record<string, unknown> = {};
    mswServer.use(http.put(`${BASE}/api/v1/merchant/merchants/${merchantId}`, async ({ request }) => {
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
