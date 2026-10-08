import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import { isRefreshRejected } from "@/server/modules/auth/merchant-auth.service";
import {
  logoutSession,
  refreshTokens,
  refreshTokensOnce,
  requestLoginOtp,
  resendOtp,
  verifyLoginOtp,
} from "@/server/modules/auth/merchant-auth.service";
import { mswServer } from "@/test/msw";

const BASE = "https://identity.test";
const AUTH = `${BASE}/api/v1/merchant/auth`;
const client = createBeClient({ baseUrl: BASE });
const envelope = (data: unknown) => ({ success: true, status: "1000", message: "success", detail: "ok", data });

const challenge = {
  requestId: "req-1",
  maskedRecipient: "a***@shop.vn",
  expiresIn: 300,
  canResendAfter: 60,
  resendRemaining: 3,
};
const tokens = { accessToken: "a.b.c", expiresIn: 300, refreshToken: "r-1", refreshExpiresIn: 86400 };

describe("isRefreshRejected", () => {
  it.each([400, 401])("rejects refresh status %i", (status) => {
    expect(isRefreshRejected({ status, code: `HTTP_${status}`, message: "Rejected" })).toBe(true);
  });
  it.each([0, 403, 429, 500, 502, 503])("preserves the session for status %i", (status) => {
    expect(isRefreshRejected({ status, code: status === 0 ? "TIMEOUT" : `HTTP_${status}`, message: "Unavailable" })).toBe(false);
  });
});

describe("merchant auth service", () => {
  it("posts email and password and returns the OTP challenge", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/login`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope({ otpRequired: true, ...challenge }));
      }),
    );
    const result = await requestLoginOtp("a@shop.vn", "Secret123!", client);
    expect(body).toEqual({ email: "a@shop.vn", password: "Secret123!" });
    expect(result).toEqual({ success: true, data: { otpRequired: true, ...challenge } });
  });

  it("surfaces the BE message for wrong credentials", async () => {
    mswServer.use(
      http.post(`${AUTH}/login`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_CREDENTIALS", detail: "Email hoặc mật khẩu không đúng" },
          { status: 401 },
        ),
      ),
    );
    const result = await requestLoginOtp("a@shop.vn", "bad", client);
    expect(result).toMatchObject({
      success: false,
      error: { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng" },
    });
  });

  it("exchanges requestId and otp for a token pair", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const result = await verifyLoginOtp("req-1", "123456", client);
    expect(body).toEqual({ requestId: "req-1", otp: "123456" });
    expect(result).toEqual({ success: true, data: tokens });
  });

  it("rejects a token pair with an empty access token", async () => {
    mswServer.use(
      http.post(`${AUTH}/login/verify-otp`, () => HttpResponse.json(envelope({ ...tokens, accessToken: "" }))),
    );
    const result = await verifyLoginOtp("req-1", "123456", client);
    expect(result).toMatchObject({ success: false, error: { code: "INVALID_RESPONSE" } });
  });

  it("resends an OTP for a request id", async () => {
    mswServer.use(http.post(`${AUTH}/otp/resend`, () => HttpResponse.json(envelope(challenge))));
    expect(await resendOtp("req-1", client)).toEqual({ success: true, data: challenge });
  });

  it("refreshes with the refresh token in the body and never sends a bearer", async () => {
    let auth: string | null = "unset";
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/refresh`, async ({ request }) => {
        auth = request.headers.get("authorization");
        body = await request.json();
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const result = await refreshTokens("r-0", client);
    expect(body).toEqual({ refreshToken: "r-0" });
    expect(auth).toBeNull();
    expect(result).toEqual({ success: true, data: tokens });
  });

  it("logs out with the refresh token", async () => {
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/logout`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(envelope(null));
      }),
    );
    expect(await logoutSession("r-1", client)).toEqual({ success: true, data: undefined });
    expect(body).toEqual({ refreshToken: "r-1" });
  });
});


describe("refreshTokensOnce", () => {
  it("shares one BE call between concurrent refreshes of the same token", async () => {
    let calls = 0;
    mswServer.use(
      http.post(`${AUTH}/refresh`, async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(envelope(tokens));
      }),
    );
    const [first, second] = await Promise.all([
      refreshTokensOnce("r-same", client),
      refreshTokensOnce("r-same", client),
    ]);
    expect(calls).toBe(1);
    expect(first).toEqual(second);

    await refreshTokensOnce("r-same", client);
    expect(calls).toBe(2);
  });
});
