import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, resetUserPassword } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  resetUserPassword: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, resetUserPassword }));
import { POST } from "../route";

const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id }) };
const request = () => new Request(`http://localhost/api/v1/admin/merchant-users/${id}/reset-password`, { method: "POST" });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
  getUser.mockResolvedValue({ success: true, data: { id, status: "ACTIVE", merchantIds: [merchantId] } });
  resetUserPassword.mockResolvedValue({ success: true, data: { success: true } });
});

describe("reset password route", () => {
  it("resets an active user's password from a request with no body or OTP", async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(resetUserPassword).toHaveBeenCalledWith(id);
  });

  it("rejects resetting your own password without contacting the BE", async () => {
    getServerSession.mockResolvedValue({ userId: id, permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it.each(["PENDING", "LOCKED"])("rejects a %s user without contacting the BE", async (status) => {
    getUser.mockResolvedValue({ success: true, data: { id, status, merchantIds: [merchantId] } });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it("denies a caller without the user-management permission", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", permissions: [], merchantIds: [merchantId] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });
});
