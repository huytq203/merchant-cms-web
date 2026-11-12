import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, registerPushToken, unregisterPushToken } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  registerPushToken: vi.fn(),
  unregisterPushToken: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/notifications/push-token.service", () => ({ registerPushToken, unregisterPushToken }));
import { DELETE, POST } from "../route";

const req = (method: string, body: unknown) =>
  new Request("http://localhost/api/v1/admin/notifications/push-token", {
    method,
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ permissions: [], merchantIds: [] });
  registerPushToken.mockResolvedValue({ success: true, data: undefined });
  unregisterPushToken.mockResolvedValue({ success: true, data: undefined });
});

describe("push-token route", () => {
  it("returns 401 without a session and forwards nothing", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await POST(req("POST", { token: "t" }))).status).toBe(401);
    expect((await DELETE(req("DELETE", { token: "t" }))).status).toBe(401);
    expect(registerPushToken).not.toHaveBeenCalled();
    expect(unregisterPushToken).not.toHaveBeenCalled();
  });

  it("registers the token", async () => {
    const payload = { token: "t", installationId: "i", platform: "WEB", appId: "merchant-portal" };
    expect((await POST(req("POST", payload))).status).toBe(204);
    expect(registerPushToken).toHaveBeenCalledWith(payload);
  });

  it("removes the token on DELETE", async () => {
    expect((await DELETE(req("DELETE", { token: "t", installationId: "i" }))).status).toBe(204);
    expect(unregisterPushToken).toHaveBeenCalledWith({ token: "t", installationId: "i" });
  });

  it("rejects a missing token or a malformed body with 400 in Vietnamese", async () => {
    const missing = await POST(req("POST", { installationId: "i" }));
    expect(missing.status).toBe(400);
    expect((await POST(req("POST", "not json"))).status).toBe(400);
    expect(registerPushToken).not.toHaveBeenCalled();
  });

  it("keeps the BE status on failure", async () => {
    registerPushToken.mockResolvedValue({ success: false, error: { status: 503, code: "X", message: "x" } });
    expect((await POST(req("POST", { token: "t" }))).status).toBe(502);
  });
});
