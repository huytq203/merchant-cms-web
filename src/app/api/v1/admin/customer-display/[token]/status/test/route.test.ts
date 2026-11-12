import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getDisplayStatus } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getDisplayStatus: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/customer-display/customer-display.service", () => ({ getDisplayStatus }));
import { GET } from "../route";

const call = (token: string) => GET(new Request("http://localhost"), { params: Promise.resolve({ token }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: ["m"], subMerchantIds: [], permissions: [] });
  getDisplayStatus.mockResolvedValue({ success: true, data: { status: "ACTIVE", paidAt: null } });
});

describe("customer-display status route", () => {
  it("needs a signed-in session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await call("abc")).status).toBe(401);
    expect(getDisplayStatus).not.toHaveBeenCalled();
  });

  it.each(["..%2Fx", "a/b", "a b", "x".repeat(513)])("rejects a malformed token %s before calling the BE", async (token) => {
    expect((await call(token)).status).toBe(404);
    expect(getDisplayStatus).not.toHaveBeenCalled();
  });

  it("returns the status without caching", async () => {
    const response = await call("eyJ.abc-_~");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ status: "ACTIVE" });
    expect(getDisplayStatus).toHaveBeenCalledWith("eyJ.abc-_~");
  });

  it("passes an expired token on as 404", async () => {
    getDisplayStatus.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "x" } });
    expect((await call("abc")).status).toBe(404);
  });
});
