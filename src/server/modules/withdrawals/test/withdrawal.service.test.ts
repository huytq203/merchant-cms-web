import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import {
  createWithdrawal, getWithdrawal, getWithdrawalBalance, listWithdrawals, requestWithdrawalOtp,
} from "../withdrawal.service";

const base = "https://merchant.test";
const path = `${base}/api/v1/merchant/withdrawal-requests`;
const merchantId = "22222222-2222-4222-8222-222222222222";
const id = "33333333-3333-4333-8333-333333333333";
const record = {
  id,
  merchantId,
  requestType: "MANUAL",
  amount: 5_000_000,
  fee: 5_500,
  currency: "VND",
  bankCode: "VCB",
  bankAccountNumber: "******1789",
  bankAccountName: "CONG TY A",
  status: "PENDING",
  transactionCode: "WD2601",
  createdAt: "2026-01-13T09:30:00",
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

describe("withdrawal service list", () => {
  it("sends the page and keeps the account number BE already masked", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([record], 17)));
    }));
    const result = await listWithdrawals({ page: 2, pageSize: 10 });
    expect(result).toMatchObject({ success: true, data: { total: 17 } });
    if (!result.success) return;
    expect(result.data.rows[0]).toMatchObject({ id, bankAccountMasked: "******1789" });
    expect(JSON.stringify(result.data)).not.toContain("*********");
    expect(Object.fromEntries(query!)).toEqual({ page: "2", size: "10" });
  });

  it("sends the code, the days and every status of the chosen stage", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(path, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope(page([])));
    }));
    await listWithdrawals({
      page: 1, pageSize: 10, transactionCode: "WD1", statusGroup: "REJECTED",
      createdFrom: "2026-01-01", createdTo: "2026-01-31",
    });
    expect(Object.fromEntries(query!)).toEqual({
      page: "1", size: "10", transactionCode: "WD1", status: "REJECTED,BANK_REJECTED,FAILED",
      createdFrom: "2026-01-01", createdTo: "2026-01-31",
    });
  });

  it("does not drop rows by merchant because BE already scopes the list by session", async () => {
    const other = { ...record, id: "77777777-7777-4777-8777-777777777777", merchantId: "55555555-5555-4555-8555-555555555555" };
    mswServer.use(http.get(path, () => HttpResponse.json(envelope(page([record, other])))));
    const result = await listWithdrawals({ page: 1, pageSize: 10 });
    expect(result).toMatchObject({ success: true });
    if (result.success) expect(result.data.rows).toHaveLength(2);
  });

  it("maps an empty Page", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json(envelope(page([], 0)))));
    expect(await listWithdrawals({ page: 1, pageSize: 10 })).toEqual({
      success: true,
      data: { rows: [], total: 0 },
    });
  });

  it("preserves 403 and rejects a malformed response", async () => {
    mswServer.use(http.get(path, () => HttpResponse.json({ success: false, message: "Cấm truy cập" }, { status: 403 })));
    expect(await listWithdrawals({ page: 1, pageSize: 10 })).toMatchObject({
      success: false,
      error: { status: 403 },
    });
    mswServer.use(http.get(`${path}/${id}`, () => HttpResponse.json(envelope({ id, status: "PAID" }))));
    expect(await getWithdrawal(id)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });
});

describe("withdrawal service detail and create", () => {
  it("encodes the id in the detail path", async () => {
    let requested = "";
    mswServer.use(http.get(`${path}/*`, ({ request }) => {
      requested = new URL(request.url).pathname;
      return HttpResponse.json(envelope(record));
    }));
    await getWithdrawal("a/b");
    expect(requested).toBe("/api/v1/merchant/withdrawal-requests/a%2Fb");
  });

  it("posts exactly the five BE fields and nothing about the merchant or the account number", async () => {
    let body: unknown;
    mswServer.use(http.post(path, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(record));
    }));
    const input = { bankAccountId: "44444444-4444-4444-8444-444444444444", amount: 5_000_000, reason: "Rút", idempotencyKey: "key-1", otp: { otpSessionId: "sess-1", otp: "123456" } };
    expect(await createWithdrawal(input)).toMatchObject({ success: true });
    expect(body).toEqual({
      bankAccountId: input.bankAccountId, amount: 5_000_000, idempotencyKey: "key-1", reason: "Rút",
      otp: { otpSessionId: "sess-1", otp: "123456" },
    });
  });

  it("leaves the reason out when there is none", async () => {
    let body: unknown;
    mswServer.use(http.post(path, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(record));
    }));
    await createWithdrawal({ bankAccountId: "44444444-4444-4444-8444-444444444444", amount: 9, idempotencyKey: "key-2", otp: { otpSessionId: "sess-1", otp: "123456" } });
    expect(Object.keys(body as object).sort()).toEqual(["amount", "bankAccountId", "idempotencyKey", "otp"]);
  });

  it("keeps the BE error when the amount exceeds the balance", async () => {
    mswServer.use(http.post(path, () => HttpResponse.json(
      { success: false, message: "Số dư không đủ", errorCode: "BUSINESS_ERROR" },
      { status: 400 },
    )));
    const input = { bankAccountId: "44444444-4444-4444-8444-444444444444", amount: 9, idempotencyKey: "key-1", otp: { otpSessionId: "sess-1", otp: "123456" } };
    expect(await createWithdrawal(input)).toMatchObject({
      success: false,
      error: { status: 400, message: "Số dư không đủ" },
    });
  });
});

describe("withdrawal balance and OTP", () => {
  it("asks for the balance of the given merchant and keeps a missing limit as null", async () => {
    let query: URLSearchParams | undefined;
    mswServer.use(http.get(`${path}/balance`, ({ request }) => {
      query = new URL(request.url).searchParams;
      return HttpResponse.json(envelope({ merchantId, availableBalance: 128_450_000, heldBalance: 200_000, dailyLimitRemaining: 500_000_000 }));
    }));
    const result = await getWithdrawalBalance(merchantId);
    expect(query?.get("merchantId")).toBe(merchantId);
    expect(result).toMatchObject({
      success: true,
      data: { availableBalance: 128_450_000, heldBalance: 200_000, minimumAmount: null, maximumAmount: null },
    });
  });

  it("rejects a balance that is not a number instead of showing it", async () => {
    mswServer.use(http.get(`${path}/balance`, () => HttpResponse.json(envelope({ merchantId, availableBalance: "x", heldBalance: 0 }))));
    expect(await getWithdrawalBalance(merchantId)).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("requests the code from the withdrawal challenge endpoint with no operation from the caller", async () => {
    let called = false;
    mswServer.use(http.post(`${path}/otp-challenge`, () => {
      called = true;
      return HttpResponse.json(envelope({ otpSessionId: "s", maskedRecipient: "a***@b.vn", expiresInSeconds: 300, canResendAfterSeconds: 60 }));
    }));
    expect(await requestWithdrawalOtp()).toMatchObject({ success: true, data: { otpSessionId: "s" } });
    expect(called).toBe(true);
  });
});
