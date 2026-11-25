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
  getUser.mockResolvedValue({ success: true, data: { id, active: true, locked: false, merchantIds: [merchantId] } });
  resetUserPassword.mockResolvedValue({ success: true, data: { mode: "TEMP_PASSWORD", emailSent: true } });
});

describe("reset password route", () => {
  it("resets an active user's password from a request with no body or OTP", async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: "TEMP_PASSWORD", emailSent: true });
    expect(resetUserPassword).toHaveBeenCalledWith(id);
  });

  it("rejects resetting your own password without contacting the BE", async () => {
    getServerSession.mockResolvedValue({ userId: id, permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it("resends the activation mail for a PENDING user through the same endpoint", async () => {
    getUser.mockResolvedValue({ success: true, data: { id, active: false, locked: false, merchantIds: [merchantId] } });
    resetUserPassword.mockResolvedValue({ success: true, data: { mode: "ACTIVATION_RESENT", emailSent: false } });
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ mode: "ACTIVATION_RESENT", emailSent: false });
  });

  it("rejects a LOCKED user without contacting the BE", async () => {
    getUser.mockResolvedValue({ success: true, data: { id, active: false, locked: true, merchantIds: [merchantId] } });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it("relays the BE failure message (5xx becomes 502 at the BFF) when the BE cannot reset", async () => {
    resetUserPassword.mockResolvedValue({ success: false, error: { status: 503, code: "HTTP_503", message: "Chưa đặt lại được mật khẩu. Vui lòng thử lại." } });
    const response = await POST(request(), context);
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ message: "Chưa đặt lại được mật khẩu. Vui lòng thử lại." });
  });

  it("denies a caller without the user-management permission", async () => {
    getServerSession.mockResolvedValue({ userId: "actor", permissions: [], merchantIds: [merchantId] });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resetUserPassword).not.toHaveBeenCalled();
  });
});
