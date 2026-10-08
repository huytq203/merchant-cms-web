import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createBeClient } from "@/lib/be/client";
import {
  changePassword,
  confirmResetOtp,
  forgotPassword,
  requestResetOtp,
  validateResetToken,
} from "@/server/modules/auth/merchant-password.service";
import { mswServer } from "@/test/msw";

const BASE = "https://identity.test";
const AUTH = `${BASE}/api/v1/merchant/auth`;
const client = createBeClient({ baseUrl: BASE, getAccessToken: async () => "tok-1" });
const envelope = (data: unknown) => ({ success: true, status: "1000", message: "success", detail: "ok", data });

describe("merchant password service", () => {
  it("changes the password with the bearer token", async () => {
    let auth: string | null = null;
    let body: unknown;
    mswServer.use(
      http.post(`${AUTH}/change-password`, async ({ request }) => {
        auth = request.headers.get("authorization");
        body = await request.json();
        return HttpResponse.json(envelope(null));
      }),
    );
    const input = { currentPassword: "Old-pass1!", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" };
    expect(await changePassword(input, client)).toMatchObject({ success: true, data: undefined });
    expect(auth).toBe("Bearer tok-1");
    expect(body).toEqual(input);
  });

  it("surfaces the BE message when the current password is wrong", async () => {
    mswServer.use(
      http.post(`${AUTH}/change-password`, () =>
        HttpResponse.json(
          { success: false, message: "INVALID_PASSWORD", detail: "Mật khẩu hiện tại không đúng" },
          { status: 400 },
        ),
      ),
    );
    const result = await changePassword(
      { currentPassword: "bad", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" },
      client,
    );
    expect(result).toMatchObject({ success: false, error: { message: "Mật khẩu hiện tại không đúng" } });
  });

  it("requests a reset link without a bearer token", async () => {
    let auth: string | null = "unset";
    mswServer.use(
      http.post(`${AUTH}/forgot-password`, ({ request }) => {
        auth = request.headers.get("authorization");
        return HttpResponse.json({ success: true, message: "success", detail: "If the email exists..." });
      }),
    );
    expect(await forgotPassword("a@shop.vn", client)).toMatchObject({ success: true, data: undefined });
    expect(auth).toBeNull();
  });

  it("validates a reset token through the query string", async () => {
    let token: string | null = null;
    mswServer.use(
      http.get(`${AUTH}/reset-password/validate`, ({ request }) => {
        token = new URL(request.url).searchParams.get("token");
        return HttpResponse.json(envelope({ valid: true, maskedEmail: "a***@shop.vn" }));
      }),
    );
    const result = await validateResetToken("tkn 1", client);
    expect(token).toBe("tkn 1");
    expect(result).toMatchObject({ success: true, data: { valid: true, maskedEmail: "a***@shop.vn" } });
  });

  it("starts a reset and confirms it with the OTP", async () => {
    const challenge = { requestId: "r-9", maskedRecipient: "a***@shop.vn", expiresIn: 300, canResendAfter: 60, resendRemaining: 3 };
    mswServer.use(
      http.post(`${AUTH}/reset-password`, () => HttpResponse.json(envelope(challenge))),
      http.post(`${AUTH}/reset-password/verify-otp`, () => HttpResponse.json(envelope(null))),
    );
    const started = await requestResetOtp(
      { token: "t", newPassword: "NewPass12!x", confirmPassword: "NewPass12!x" },
      client,
    );
    expect(started).toMatchObject({ success: true, data: challenge });
    expect(await confirmResetOtp("r-9", "123456", client)).toMatchObject({ success: true, data: undefined });
  });
});
