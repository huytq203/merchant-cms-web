import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
const getServerSession = vi.fn();

vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));

function jsonRequest(url: string, body: unknown): Request {
  return new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setup() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
}

describe("auth route handlers", () => {
  beforeEach(() => {
    getServerSession.mockReset();
    cookieStore.delete.mockReset();
    cookieStore.get.mockReset();
  });

  it("session-expired clears both cookies and redirects to /login", async () => {
    await setup();
    const { GET } = await import("@/app/api/v1/admin/auth/session-expired/route");
    const response = await GET(new Request("http://localhost:3000/api/v1/admin/auth/session-expired") as never);
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });

  async function callSessionExpired(cookies: Record<string, string>, query = "") {
    cookieStore.get.mockImplementation((name: string) => (name in cookies ? { value: cookies[name] } : undefined));
    const { GET } = await import("@/app/api/v1/admin/auth/session-expired/route");
    return GET(new Request(`http://localhost:3000/api/v1/admin/auth/session-expired${query}`) as never);
  }

  it("session-expired refreshes with a valid refresh cookie and returns to the callback instead of logging out", async () => {
    await setup();
    cookieStore.set.mockReset();
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json({
      success: true,
      message: "success",
      data: { accessToken: "a-new", expiresIn: 300, refreshToken: "r-new", refreshExpiresIn: 86_400 },
    })));
    const response = await callSessionExpired({ refresh_token: "r-old" }, "?callbackUrl=%2Forder%3Fpage%3D2");
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname + location.search).toBe("/order?page=2");
    expect(cookieStore.set).toHaveBeenCalledWith("access_token", "a-new", expect.anything());
    expect(cookieStore.set).toHaveBeenCalledWith("refresh_token", "r-new", expect.anything());
    expect(cookieStore.delete).not.toHaveBeenCalledWith("refresh_token");
  });

  it("session-expired logs out when the refresh is rejected", async () => {
    await setup();
    mswServer.use(http.post(`${AUTH}/refresh`, () =>
      HttpResponse.json({ success: false, message: "INVALID_TOKEN" }, { status: 401 }),
    ));
    const response = await callSessionExpired({ refresh_token: "r-old" });
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });

  it("session-expired keeps the cookies when the identity service is unavailable", async () => {
    await setup();
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json({}, { status: 503 })));
    const response = await callSessionExpired({ refresh_token: "r-old" });
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(cookieStore.delete).not.toHaveBeenCalledWith("refresh_token");
  });

  it("session-expired logs out without refreshing again right after a refresh that did not help", async () => {
    await setup();
    let refreshes = 0;
    mswServer.use(http.post(`${AUTH}/refresh`, () => {
      refreshes += 1;
      return HttpResponse.json({}, { status: 500 });
    }));
    const response = await callSessionExpired({ refresh_token: "r-new", session_refreshed: "1" });
    expect(refreshes).toBe(0);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });

  it("change-password requires a session", async () => {
    await setup();
    getServerSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "a", newPassword: "ValidPass12!x" }));
    expect(response.status).toBe(401);
  });

  it("change-password rejects a weak new password before calling the BE", async () => {
    await setup();
    getServerSession.mockResolvedValue({ userId: "u" });
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "a", newPassword: "weak" }));
    expect(response.status).toBe(400);
  });

  it("change-password forwards the BE message and status", async () => {
    await setup();
    getServerSession.mockResolvedValue({ userId: "u" });
    cookieStore.get.mockReturnValue({ value: "tok" });
    mswServer.use(http.post(`${AUTH}/change-password`, () =>
      HttpResponse.json({ success: false, message: "INVALID_PASSWORD", detail: "Mật khẩu hiện tại không đúng" }, { status: 400 }),
    ));
    const { POST } = await import("@/app/api/v1/admin/auth/change-password/route");
    const response = await POST(jsonRequest("/x", { currentPassword: "bad", newPassword: "ValidPass12!x" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ message: "Mật khẩu hiện tại không đúng" });
  });

  it("forgot-password answers with the generic message and validates the email", async () => {
    await setup();
    mswServer.use(http.post(`${AUTH}/forgot-password`, () => HttpResponse.json({ success: true, message: "success" })));
    const { POST } = await import("@/app/api/v1/admin/auth/forgot-password/route");
    const ok = await POST(jsonRequest("/x", { email: "a@shop.vn" }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ success: true });
    const bad = await POST(jsonRequest("/x", { email: "nope" }));
    expect(bad.status).toBe(400);
  });

  it("refresh answers 401 and clears cookies when there is no refresh token", async () => {
    await setup();
    cookieStore.get.mockReturnValue(undefined);
    const { POST } = await import("@/app/api/v1/admin/auth/refresh/route");
    const response = await POST();
    expect(response.status).toBe(401);
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });

  it.each([503, 429])("refresh preserves cookies on backend status %i", async (status) => {
    await setup();
    cookieStore.get.mockReturnValue({ value: "refresh-token" });
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json({ message: "Unavailable" }, { status })));
    const { POST } = await import("@/app/api/v1/admin/auth/refresh/route");
    const response = await POST();
    expect(response.status).toBe(status === 503 ? 502 : 429);
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("refresh clears cookies and returns 401 when the backend rejects the token", async () => {
    await setup();
    cookieStore.get.mockReturnValue({ value: "refresh-token" });
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json({ message: "Rejected" }, { status: 400 })));
    const { POST } = await import("@/app/api/v1/admin/auth/refresh/route");
    const response = await POST();
    expect(response.status).toBe(401);
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
  });
});
