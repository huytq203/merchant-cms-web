import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mswServer } from "@/test/msw";
import { registerPushToken, unregisterPushToken } from "../push-token.service";

const base = "https://notification.test/notification";
const body = { token: "t", installationId: "i", platform: "WEB", appId: "merchant-portal" };

vi.mock("@/lib/auth/session-cookies", () => ({ readAccessToken: async () => "user-jwt" }));

beforeEach(() => {
  vi.stubEnv("IDENTITY_BASE_URL", "https://identity.test");
  vi.stubEnv("MERCHANT_BASE_URL", "https://merchant.test");
  vi.stubEnv("NOTIFICATION_BASE_URL", "https://notification.test");
});

describe("push token service", () => {
  it("forwards the registration with the user's own bearer token", async () => {
    let auth: string | null = null;
    let received: unknown;
    mswServer.use(http.post(`${base}/register-token`, async ({ request }) => {
      auth = request.headers.get("authorization");
      received = await request.json();
      return HttpResponse.json({ message: "OK", data: true, code: 200 });
    }));
    const result = await registerPushToken(body);
    expect(result.success).toBe(true);
    expect(auth).toBe("Bearer user-jwt");
    expect(received).toEqual(body);
  });

  it("calls unregister-token for a removal", async () => {
    let hit = false;
    mswServer.use(http.post(`${base}/unregister-token`, () => {
      hit = true;
      return HttpResponse.json({ message: "OK", data: true, code: 200 });
    }));
    expect((await unregisterPushToken({ token: "t", installationId: "i" })).success).toBe(true);
    expect(hit).toBe(true);
  });

  it("maps an upstream failure to a Vietnamese message", async () => {
    mswServer.use(http.post(`${base}/register-token`, () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })));
    const result = await registerPushToken(body);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.status).toBe(401);
      expect(result.error.message).toBe("Phiên đăng nhập đã hết hạn");
    }
  });

  it("fails with 503 when the notification base URL is not configured", async () => {
    vi.stubEnv("NOTIFICATION_BASE_URL", "");
    vi.resetModules(); // getServerEnv cache giá trị lần đọc đầu
    const fresh = await import("../push-token.service");
    const result = await fresh.registerPushToken(body);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.status).toBe(503);
  });
});
