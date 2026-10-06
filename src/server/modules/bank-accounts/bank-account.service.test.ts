import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  createBankAccount,
  deleteBankAccount,
  getBankAccount,
  listBankAccounts,
  requestSensitiveOtp,
  setDefaultBankAccount,
  updateBankAccount,
  verifyBankLink,
} from "./bank-account.service";

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => null }));

const base = "https://merchant.test";
const accountsUrl = `${base}/api/v1/admin/merchant-bank-accounts`;
const portalUrl = `${base}/api/v1/merchant/bank-accounts`;
const otpUrl = `${base}/api/v1/admin/sensitive-operations/otp-challenge`;
const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const account = {
  id,
  version: 3,
  merchantId,
  bankCode: "VCB",
  accountNumber: "1234567890",
  accountName: "CONG TY A",
  status: "ACTIVE",
  linkStatus: "LINKED",
  default: true,
};
const otp = { otpSessionId: "session-1", otp: "123456" };
const envelope = (data?: unknown) => ({ success: true, ...(data === undefined ? {} : { data }) });
const page = (content: unknown[], totalElements = content.length) => ({
  content,
  totalElements,
  totalPages: 1,
  number: 0,
  size: 10,
});

beforeEach(() => {
  vi.stubEnv("MERCHANT_BASE_URL", base);
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
});

describe("bank account service", () => {
  it("reads the merchant portal list, lets the BE scope by session (no merchantId sent) and normalizes the default flag", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(portalUrl, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([account], 11)));
    }));
    const result = await listBankAccounts({ page: 2, pageSize: 10, merchantId, linkStatus: "LINKED" });
    expect(result).toMatchObject({ success: true, data: { total: 11, rows: [{ id, isDefault: true }] } });
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "10", linkStatus: "LINKED" });
  });

  it("maps an empty Page", async () => {
    mswServer.use(http.get(portalUrl, () => HttpResponse.json(envelope(page([], 0)))));
    expect(await listBankAccounts({ page: 1, pageSize: 10, merchantId })).toEqual({
      success: true,
      data: { rows: [], total: 0 },
    });
  });

  it("encodes the id and rejects a malformed account", async () => {
    let requested = "";
    mswServer.use(http.get(`${portalUrl}/*`, ({ request }) => {
      requested = new URL(request.url).pathname;
      return HttpResponse.json(envelope({ id }));
    }));
    expect(await getBankAccount("a/b?c")).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
    expect(requested).toBe("/api/v1/merchant/bank-accounts/a%2Fb%3Fc");
  });

  it("creates with the nested OTP confirmation and accepts a bare account response", async () => {
    let body: unknown;
    mswServer.use(http.post(accountsUrl, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(account), { status: 201 });
    }));
    const result = await createBankAccount({
      merchantId,
      bankCode: "VCB",
      accountNumber: "1234567890",
      accountName: "CONG TY A",
      otp,
    });
    expect(body).toMatchObject({ bankCode: "VCB", otp });
    expect(result).toMatchObject({ success: true, data: { applied: true, account: { id } } });
  });

  it("updates with version and reports a pending change request", async () => {
    let body: unknown;
    const pendingChangeRequest = {
      id: "33333333-3333-4333-8333-333333333333",
      bankAccountId: id,
      changeType: "UPDATE_ACCOUNT",
      status: "PENDING",
    };
    mswServer.use(http.put(`${accountsUrl}/${id}`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope({ account, applied: false, pendingChangeRequest }));
    }));
    const result = await updateBankAccount(id, { version: 3, accountNumber: "9999999999", otp });
    expect(body).toEqual({ version: 3, accountNumber: "9999999999", otp });
    expect(result).toMatchObject({ success: true, data: { applied: false, pendingChangeRequest: { status: "PENDING" } } });
  });

  it("keeps the message and code of a stale version (409)", async () => {
    mswServer.use(http.put(`${accountsUrl}/${id}`, () =>
      HttpResponse.json({ success: false, message: "Dữ liệu đã thay đổi", errorCode: "VERSION_CONFLICT" }, { status: 409 }),
    ));
    expect(await updateBankAccount(id, { version: 1 })).toMatchObject({
      success: false,
      error: { status: 409, code: "VERSION_CONFLICT", message: "Dữ liệu đã thay đổi" },
    });
  });

  it("keeps the code of a wrong OTP so the UI can tell it apart", async () => {
    mswServer.use(http.post(accountsUrl, () =>
      HttpResponse.json({ success: false, message: "MERCHANT_SENSITIVE_OTP_INVALID" }, { status: 400 }),
    ));
    const result = await createBankAccount({ merchantId, bankCode: "VCB", accountNumber: "123456", accountName: "A", otp });
    expect(result).toMatchObject({ success: false, error: { status: 400, code: "MERCHANT_SENSITIVE_OTP_INVALID" } });
  });

  it("deletes with an optional reason and accepts an empty payload", async () => {
    const bodies: unknown[] = [];
    mswServer.use(http.delete(`${accountsUrl}/${id}`, async ({ request }) => {
      bodies.push(await request.text());
      return HttpResponse.json(envelope());
    }));
    expect(await deleteBankAccount(id)).toEqual({ success: true, data: undefined });
    expect(await deleteBankAccount(id, "Không còn dùng")).toMatchObject({ success: true });
    expect(bodies).toEqual(["", JSON.stringify({ reason: "Không còn dùng" })]);
  });

  it("sets the default account", async () => {
    mswServer.use(http.put(`${accountsUrl}/${id}/default`, () =>
      HttpResponse.json(envelope({ account, applied: true })),
    ));
    expect(await setDefaultBankAccount(id)).toMatchObject({ success: true, data: { applied: true } });
  });

  it("records link verification through query parameters without a body", async () => {
    let url: URL | undefined;
    let text = "unset";
    mswServer.use(http.post(`${accountsUrl}/${id}/link-verification`, async ({ request }) => {
      url = new URL(request.url);
      text = await request.text();
      return HttpResponse.json(envelope(account));
    }));
    expect(await verifyBankLink(id, { linked: false, failureReason: "Sai tên" })).toMatchObject({ success: true });
    expect(Object.fromEntries(url!.searchParams)).toEqual({ linked: "false", failureReason: "Sai tên" });
    expect(text).toBe("");
  });

  it("requests a bank-change OTP challenge", async () => {
    let body: unknown;
    mswServer.use(http.post(otpUrl, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope({
        otpSessionId: "session-1",
        maskedRecipient: "0912•••678",
        expiresInSeconds: 300,
        canResendAfterSeconds: 60,
      }));
    }));
    expect(await requestSensitiveOtp("BANK_ACCOUNT_CHANGE", id)).toMatchObject({
      success: true,
      data: { otpSessionId: "session-1", canResendAfterSeconds: 60 },
    });
    expect(body).toEqual({ operation: "BANK_ACCOUNT_CHANGE", targetId: id });
  });
});
