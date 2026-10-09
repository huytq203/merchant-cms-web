// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mswServer } from "@/test/msw";

let apiClient: typeof import("@/lib/http/api-client").apiClient;
let ApiError: typeof import("@/lib/http/api-client").ApiError;

const ORIGIN = window.location.origin;

describe("apiClient 401 handling in the browser", () => {
  const expired = vi.fn();

  beforeEach(async () => {
    vi.resetModules();
    const apiClientModule = await import("@/lib/http/api-client");
    apiClient = apiClientModule.apiClient;
    ApiError = apiClientModule.ApiError;
    expired.mockReset();
    apiClientModule.setSessionExpiredHandler(expired);
  });

  it("refreshes once and retries the original request", async () => {
    let attempts = 0;
    let refreshes = 0;
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
          : HttpResponse.json({ ok: true });
      }),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => {
        refreshes += 1;
        return HttpResponse.json({ userId: "u" });
      }),
    );
    await expect(apiClient.get("/v1/things")).resolves.toEqual({ ok: true });
    expect(refreshes).toBe(1);
    expect(attempts).toBe(2);
    expect(expired).not.toHaveBeenCalled();
  });

  it("shares one refresh between parallel 401s", async () => {
    let refreshes = 0;
    const seen = new Set<string>();
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/a`, ({ request }) =>
        seen.has(request.url) ? HttpResponse.json({ ok: "a" }) : (seen.add(request.url), HttpResponse.json({}, { status: 401 })),
      ),
      http.get(`${ORIGIN}/api/v1/b`, ({ request }) =>
        seen.has(request.url) ? HttpResponse.json({ ok: "b" }) : (seen.add(request.url), HttpResponse.json({}, { status: 401 })),
      ),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, async () => {
        refreshes += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({});
      }),
    );
    await Promise.all([apiClient.get("/v1/a"), apiClient.get("/v1/b")]);
    expect(refreshes).toBe(1);
  });

  it("signals session expiry and throws when the refresh fails", async () => {
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => HttpResponse.json({}, { status: 401 })),
    );
    await expect(apiClient.get("/v1/things")).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it.each([503, 429])("keeps the session when refresh responds %i", async (status) => {
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => HttpResponse.json({}, { status })),
    );
    await expect(apiClient.get("/v1/things")).rejects.toMatchObject({ status: 503, message: "Không kết nối được máy chủ" });
    expect(expired).not.toHaveBeenCalled();
  });

  it("keeps the session when the refresh succeeds but the retry still returns 401", async () => {
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => HttpResponse.json({ ok: true })),
    );
    await expect(apiClient.get("/v1/things")).rejects.toMatchObject({ status: 401 });
    expect(expired).not.toHaveBeenCalled();
  });
  it("keeps the session when the refresh request has a network error", async () => {
    mswServer.use(
      http.get(`${ORIGIN}/api/v1/things`, () => HttpResponse.json({}, { status: 401 })),
      http.post(`${ORIGIN}/api/v1/admin/auth/refresh`, () => HttpResponse.error()),
    );
    await expect(apiClient.get("/v1/things")).rejects.toMatchObject({ status: 503 });
    expect(expired).not.toHaveBeenCalled();
  });

  it("does not try to refresh for auth endpoints", async () => {
    mswServer.use(
      http.post(`${ORIGIN}/api/v1/admin/auth/change-password`, () =>
        HttpResponse.json({ message: "Mật khẩu hiện tại không đúng" }, { status: 401 }),
      ),
    );
    await expect(apiClient.post("/v1/admin/auth/change-password", {})).rejects.toMatchObject({
      status: 401,
      message: "Mật khẩu hiện tại không đúng",
    });
    expect(expired).not.toHaveBeenCalled();
  });
});
