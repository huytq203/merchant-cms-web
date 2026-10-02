import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";
import { fakeJwt } from "@/test/jwt";

const AUTH = "https://identity.test/api/v1/merchant/auth";
const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 300 });
const tokens = { accessToken, expiresIn: 300, refreshToken: "r-new", refreshExpiresIn: 86_400 };
const envelope = (data: unknown) => ({ success: true, message: "success", data });

function request(path: string, cookie?: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

async function loadProxy() {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.resetModules();
  return (await import("@/proxy")).proxy;
}

describe("proxy", () => {
  beforeEach(() => vi.resetModules());

  it("redirects anonymous users to /login with a callback", async () => {
    const proxy = await loadProxy();
    const response = await proxy(request("/orders?page=2"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("/orders?page=2");
  });

  it("refreshes silently when only the refresh cookie is present", async () => {
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json(envelope(tokens))));
    const proxy = await loadProxy();
    const response = await proxy(request("/dashboard", "refresh_token=r-old"));
    expect(response.status).toBe(200);
    expect(response.cookies.get("access_token")?.value).toBe(accessToken);
    expect(response.cookies.get("refresh_token")?.value).toBe("r-new");
  });

  it("clears the cookies and redirects when the refresh is rejected", async () => {
    mswServer.use(
      http.post(`${AUTH}/refresh`, () =>
        HttpResponse.json({ success: false, message: "INVALID_TOKEN" }, { status: 401 }),
      ),
    );
    const proxy = await loadProxy();
    const response = await proxy(request("/dashboard", "refresh_token=r-old"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/login");
    expect(response.cookies.get("refresh_token")?.value).toBe("");
  });

  it("sends a user with a refresh cookie on /login to the dashboard after refreshing", async () => {
    mswServer.use(http.post(`${AUTH}/refresh`, () => HttpResponse.json(envelope(tokens))));
    const proxy = await loadProxy();
    const response = await proxy(request("/login", "refresh_token=r-old"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/dashboard");
    expect(response.cookies.get("access_token")?.value).toBe(accessToken);
  });

  it("answers CORS preflight for API routes without touching auth", async () => {
    const proxy = await loadProxy();
    const response = await proxy(
      new NextRequest("http://localhost:3000/api/v1/anything", {
        method: "OPTIONS",
        headers: { origin: "http://localhost:3000" },
      }),
    );
    expect(response.status).toBe(204);
  });
});
