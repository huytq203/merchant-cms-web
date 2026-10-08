import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser, resendUserActivation } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getUser: vi.fn(),
  resendUserActivation: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, resendUserActivation }));
import { POST } from "../route";

const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id }) };
const request = () => new Request(`http://localhost/api/v1/admin/merchant-users/${id}/resend-activation`, { method: "POST" });
const pending = { id, active: false, locked: false, merchantIds: [merchantId] };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId] });
  getUser.mockResolvedValue({ success: true, data: pending });
  resendUserActivation.mockResolvedValue({ success: true, data: { id }, message: "Resend merchant user activation success" });
});

describe("resend activation route", () => {
  it("queues the mail for a pending user and forwards the BE message", async () => {
    const response = await POST(request(), context);
    expect(response.status).toBe(200);
    expect(resendUserActivation).toHaveBeenCalledWith(id);
    expect(response.headers.get("X-Api-Message")).toBe(encodeURIComponent("Resend merchant user activation success"));
  });

  it.each([
    ["an active user", { ...pending, active: true }],
    ["a locked user", { ...pending, locked: true }],
  ])("refuses %s without contacting the BE", async (_label, data) => {
    getUser.mockResolvedValue({ success: true, data });
    expect((await POST(request(), context)).status).toBe(403);
    expect(resendUserActivation).not.toHaveBeenCalled();
  });

  it("returns 401 without a session and 403 without MANAGE_USER", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ userId: "actor", permissions: [], merchantIds: [merchantId] });
    expect((await POST(request(), context)).status).toBe(401);
    expect((await POST(request(), context)).status).toBe(403);
    expect(resendUserActivation).not.toHaveBeenCalled();
  });

  it("hides a user outside the actor's merchants as 404", async () => {
    getUser.mockResolvedValue({ success: true, data: { ...pending, merchantIds: ["99999999-9999-4999-8999-999999999999"] } });
    expect((await POST(request(), context)).status).toBe(404);
    expect(resendUserActivation).not.toHaveBeenCalled();
  });
});
