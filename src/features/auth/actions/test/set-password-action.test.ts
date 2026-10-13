import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const envelope = (data: unknown) => ({ success: true, message: "success", data });
const challenge = { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresIn: 300, canResendAfter: 60, resendRemaining: 3 };
const PASSWORD = "Mat-khau@2026".replace("-", "");

async function load() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return import("@/features/auth/actions/set-password-action");
}

describe("set-password actions", () => {
  beforeEach(() => vi.unstubAllEnvs());

  it("tells a usable link from a spent or unknown one without leaking why", async () => {
    mswServer.use(http.get(`${AUTH}/reset-password/validate`, ({ request }) => {
      const token = new URL(request.url).searchParams.get("token");
      return token === "good"
        ? HttpResponse.json(envelope({ valid: true, maskedEmail: "a***@shop.vn" }))
        : HttpResponse.json({ success: false, message: "TOKEN_INVALID" }, { status: 400 });
    }));
    const { checkSetPasswordLink } = await load();
    expect(await checkSetPasswordLink("good")).toEqual({ valid: true, maskedEmail: "a***@shop.vn" });
    expect(await checkSetPasswordLink("spent")).toEqual({ valid: false });
    expect(await checkSetPasswordLink("")).toEqual({ valid: false });
  });

  it("checks the password rules and the match before calling BE", async () => {
    const called = vi.fn();
    mswServer.use(http.post(`${AUTH}/reset-password`, () => {
      called();
      return HttpResponse.json(envelope(challenge));
    }));
    const { requestSetPasswordOtpAction } = await load();
    expect(await requestSetPasswordOtpAction({ token: "t", newPassword: "short", confirmPassword: "short" }))
      .toMatchObject({ success: false });
    expect(await requestSetPasswordOtpAction({ token: "t", newPassword: PASSWORD, confirmPassword: PASSWORD + "x" }))
      .toMatchObject({ success: false, error: "Mật khẩu nhập lại không khớp" });
    expect(await requestSetPasswordOtpAction({ token: "", newPassword: PASSWORD, confirmPassword: PASSWORD }))
      .toMatchObject({ success: false });
    expect(called).not.toHaveBeenCalled();
  });

  it("sends the token and the password, and returns the challenge for the code step", async () => {
    let body: unknown;
    mswServer.use(http.post(`${AUTH}/reset-password`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(challenge));
    }));
    const { requestSetPasswordOtpAction } = await load();
    const result = await requestSetPasswordOtpAction({ token: "t", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(body).toEqual({ token: "t", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(result).toEqual({
      success: true,
      data: { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresInSeconds: 300, resendAfterSeconds: 60, resendRemaining: 3 },
    });
  });

  it("keeps the BE message when the link was used up between the form and the send", async () => {
    mswServer.use(http.post(`${AUTH}/reset-password`, () =>
      HttpResponse.json({ success: false, message: "Liên kết đã hết hạn" }, { status: 400 })));
    const { requestSetPasswordOtpAction } = await load();
    expect(await requestSetPasswordOtpAction({ token: "t", newPassword: PASSWORD, confirmPassword: PASSWORD }))
      .toMatchObject({ success: false, error: "Liên kết đã hết hạn" });
  });

  it("confirms with the request id and a six digit code only", async () => {
    let body: unknown;
    mswServer.use(http.post(`${AUTH}/reset-password/verify-otp`, async ({ request }) => {
      body = await request.json();
      return HttpResponse.json(envelope(null));
    }));
    const { confirmSetPasswordOtpAction } = await load();
    expect(await confirmSetPasswordOtpAction({ requestId: "req-1", otp: "12" })).toMatchObject({ success: false });
    expect(body).toBeUndefined();
    expect(await confirmSetPasswordOtpAction({ requestId: "req-1", otp: "123456" })).toEqual({ success: true, data: true });
    expect(body).toEqual({ requestId: "req-1", otp: "123456" });
  });

  it("shows a wrong code as a message, not a success", async () => {
    mswServer.use(http.post(`${AUTH}/reset-password/verify-otp`, () =>
      HttpResponse.json({ success: false, message: "Mã OTP không đúng" }, { status: 400 })));
    const { confirmSetPasswordOtpAction } = await load();
    expect(await confirmSetPasswordOtpAction({ requestId: "req-1", otp: "000000" }))
      .toMatchObject({ success: false, error: "Mã OTP không đúng" });
  });

  it("resends a code for the same request", async () => {
    mswServer.use(http.post(`${AUTH}/otp/resend`, () => HttpResponse.json(envelope({ ...challenge, resendRemaining: 2 }))));
    const { resendSetPasswordOtpAction } = await load();
    expect(await resendSetPasswordOtpAction({ requestId: "req-1" })).toMatchObject({ success: true, data: { resendRemaining: 2 } });
    expect(await resendSetPasswordOtpAction({ requestId: "" })).toMatchObject({ success: false });
  });

  it("passes the identity error code through, so the page can tell a policy rejection from a wrong code", async () => {
    mswServer.use(http.post(`${AUTH}/reset-password/verify-otp`, () =>
      HttpResponse.json({ success: false, message: "Mật khẩu mới không được trùng với các mật khẩu đã sử dụng gần đây", errorCode: "20010" }, { status: 400 })));
    const { confirmSetPasswordOtpAction } = await load();
    expect(await confirmSetPasswordOtpAction({ requestId: "req-1", otp: "123456" }))
      .toMatchObject({ success: false, code: "20010" });
  });

  it("retries with another password for the same request, checking the rules and the match first", async () => {
    let body: unknown;
    const called = vi.fn();
    mswServer.use(http.post(`${AUTH}/reset-password/retry`, async ({ request }) => {
      called();
      body = await request.json();
      return HttpResponse.json(envelope(null));
    }));
    const { retrySetPasswordAction } = await load();
    expect(await retrySetPasswordAction({ requestId: "req-1", newPassword: "short", confirmPassword: "short" })).toMatchObject({ success: false });
    expect(await retrySetPasswordAction({ requestId: "req-1", newPassword: PASSWORD, confirmPassword: PASSWORD + "x" }))
      .toMatchObject({ success: false, error: "Mật khẩu nhập lại không khớp" });
    expect(await retrySetPasswordAction({ requestId: "", newPassword: PASSWORD, confirmPassword: PASSWORD })).toMatchObject({ success: false });
    expect(called).not.toHaveBeenCalled();
    expect(await retrySetPasswordAction({ requestId: "req-1", newPassword: PASSWORD, confirmPassword: PASSWORD })).toEqual({ success: true, data: true });
    expect(body).toEqual({ requestId: "req-1", newPassword: PASSWORD, confirmPassword: PASSWORD });
  });

  it("keeps the code of a retry the policy rejected again", async () => {
    mswServer.use(http.post(`${AUTH}/reset-password/retry`, () =>
      HttpResponse.json({ success: false, message: "Mật khẩu không được trùng với email", errorCode: "20018" }, { status: 400 })));
    const { retrySetPasswordAction } = await load();
    expect(await retrySetPasswordAction({ requestId: "req-1", newPassword: PASSWORD, confirmPassword: PASSWORD }))
      .toMatchObject({ success: false, error: "Mật khẩu không được trùng với email", code: "20018" });
  });
});
