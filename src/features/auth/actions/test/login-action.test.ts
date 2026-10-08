import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { fakeJwt } from "@/test/jwt";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const envelope = (data: unknown) => ({ success: true, message: "success", data });
const challenge = { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresIn: 300, canResendAfter: 60, resendRemaining: 3 };

const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
}));

async function load() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return import("@/features/auth/actions/login-action");
}

describe("login actions", () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
    cookieStore.delete.mockReset();
  });

  it("rejects an invalid email before calling the BE", async () => {
    const { loginAction } = await load();
    const result = await loginAction({ email: "nope", password: "x" });
    expect(result).toMatchObject({ success: false, code: "VALIDATION" });
  });

  it("returns the OTP challenge and sets no cookies after step 1", async () => {
    mswServer.use(http.post(`${AUTH}/login`, () => HttpResponse.json(envelope({ otpRequired: true, ...challenge }))));
    const { loginAction } = await load();
    const result = await loginAction({ email: "a@shop.vn", password: "Secret123!" });
    expect(result).toEqual({
      success: true,
      data: { requestId: "req-1", maskedRecipient: "a***@shop.vn", expiresInSeconds: 300, resendAfterSeconds: 60, resendRemaining: 3 },
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("shows the BE message for wrong credentials", async () => {
    mswServer.use(http.post(`${AUTH}/login`, () =>
      HttpResponse.json({ success: false, message: "INVALID_CREDENTIALS", detail: "Email hoặc mật khẩu không đúng" }, { status: 401 }),
    ));
    const { loginAction } = await load();
    const result = await loginAction({ email: "a@shop.vn", password: "bad" });
    expect(result).toMatchObject({ success: false, error: "Email hoặc mật khẩu không đúng", code: "INVALID_CREDENTIALS" });
  });

  it("sets both session cookies after a correct OTP", async () => {
    const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 300 });
    mswServer.use(http.post(`${AUTH}/login/verify-otp`, () =>
      HttpResponse.json(envelope({ accessToken, expiresIn: 300, refreshToken: "r-1", refreshExpiresIn: 86_400 })),
    ));
    const { verifyLoginOtpAction } = await load();
    const result = await verifyLoginOtpAction({ requestId: "req-1", otp: "123456" });
    expect(result).toEqual({ success: true, data: { redirectTo: "/dashboard" } });
    const names = cookieStore.set.mock.calls.map((call) => call[0]);
    expect(names).toEqual(["access_token", "refresh_token"]);
  });

  it("keeps the user on the form and sets no cookies after a wrong OTP", async () => {
    mswServer.use(http.post(`${AUTH}/login/verify-otp`, () =>
      HttpResponse.json({ success: false, message: "INVALID_OTP", detail: "Mã OTP không đúng" }, { status: 400 }),
    ));
    const { verifyLoginOtpAction } = await load();
    const result = await verifyLoginOtpAction({ requestId: "req-1", otp: "000000" });
    expect(result).toMatchObject({ success: false, error: "Mã OTP không đúng" });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a malformed OTP locally", async () => {
    const { verifyLoginOtpAction } = await load();
    expect(await verifyLoginOtpAction({ requestId: "req-1", otp: "12" })).toMatchObject({ success: false, code: "VALIDATION" });
  });

  it("logs out by clearing cookies even when the BE call fails, then redirects to /login", async () => {
    cookieStore.get.mockReturnValue({ value: "r-1" });
    mswServer.use(http.post(`${AUTH}/logout`, () => HttpResponse.error()));
    vi.resetModules();
    vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
    vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
    const { logoutAction } = await import("@/features/auth/actions/logout-action");
    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });
});
