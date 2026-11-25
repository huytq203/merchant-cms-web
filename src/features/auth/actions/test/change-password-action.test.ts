import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fakeJwt } from "@/test/jwt";
import { mswServer } from "@/test/msw";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const PASSWORD = "MatKhau@2026x";

async function load() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return import("@/features/auth/actions/change-password-action");
}

describe("changeFirstLoginPasswordAction", () => {
  beforeEach(() => {
    cookieStore.set.mockReset();
  });

  it("rejects a mismatched confirmation before calling the BE", async () => {
    const { changeFirstLoginPasswordAction } = await load();
    const result = await changeFirstLoginPasswordAction({ ticket: "tk", newPassword: PASSWORD, confirmPassword: "khac" });
    expect(result).toMatchObject({ success: false, code: "VALIDATION" });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("rejects a missing ticket locally with the expired-session code", async () => {
    const { changeFirstLoginPasswordAction } = await load();
    const result = await changeFirstLoginPasswordAction({ ticket: "", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(result).toMatchObject({ success: false, code: "CHANGE_PASSWORD_TICKET_INVALID" });
  });

  it("stores the session cookies and points at the dashboard on success", async () => {
    const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 300 });
    mswServer.use(http.post(`${AUTH}/first-login/change-password`, () =>
      HttpResponse.json({ success: true, message: "success", data: { accessToken, expiresIn: 300, refreshToken: "r-1", refreshExpiresIn: 86_400 } }),
    ));
    const { changeFirstLoginPasswordAction } = await load();
    const result = await changeFirstLoginPasswordAction({ ticket: "tk", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(result).toEqual({ success: true, data: { redirectTo: "/dashboard" } });
    expect(cookieStore.set.mock.calls.map((call) => call[0])).toEqual(["access_token", "refresh_token"]);
  });

  it("passes the BE code and message through and sets no cookies on a rejected ticket", async () => {
    mswServer.use(http.post(`${AUTH}/first-login/change-password`, () =>
      HttpResponse.json({ success: false, status: "2020", message: "CHANGE_PASSWORD_TICKET_INVALID", detail: "Phiên đổi mật khẩu đã hết hạn, vui lòng đăng nhập lại." }, { status: 400 }),
    ));
    const { changeFirstLoginPasswordAction } = await load();
    const result = await changeFirstLoginPasswordAction({ ticket: "tk", newPassword: PASSWORD, confirmPassword: PASSWORD });
    expect(result).toMatchObject({ success: false, code: "CHANGE_PASSWORD_TICKET_INVALID", error: "Phiên đổi mật khẩu đã hết hạn, vui lòng đăng nhập lại." });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
