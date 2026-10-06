import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getUser } = vi.hoisted(() => ({ getServerSession: vi.fn(), getUser: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ getUser, updateUser: vi.fn() }));
import { GET } from "./route";

const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";
const session = { userId: "actor", permissions: ["MANAGE_USER"], merchantIds: [merchantId], subMerchantIds: [] };
const user = { id, email: "user@example.com", fullName: "Test User", status: "ACTIVE", merchantIds: [merchantId] };
const request = () => new Request(`http://localhost/api/v1/admin/merchant-users/${id}`);
const context = { params: Promise.resolve({ id }) };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  getUser.mockResolvedValue({ success: true, data: user });
});

describe("merchant user detail route (GET)", () => {
  it("returns 401 without a session and 403 without MANAGE_USER, never reading the user", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...session, permissions: [] });
    expect((await GET(request(), context)).status).toBe(401);
    expect((await GET(request(), context)).status).toBe(403);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns 404 for a malformed id without calling the BE", async () => {
    const response = await GET(request(), { params: Promise.resolve({ id: "not-a-uuid" }) });
    expect(response.status).toBe(404);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("returns the user when every merchant of the user is within the actor scope", async () => {
    const response = await GET(request(), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(user);
    expect(getUser).toHaveBeenCalledWith(id);
  });

  it("hides a user that belongs to a merchant outside the actor scope", async () => {
    getUser.mockResolvedValue({ success: true, data: { ...user, merchantIds: ["33333333-3333-4333-8333-333333333333"] } });
    expect((await GET(request(), context)).status).toBe(404);
  });

  it("keeps the BE status and message when the BE rejects", async () => {
    getUser.mockResolvedValue({ success: false, error: { status: 404, code: "NOT_FOUND", message: "Không tìm thấy" } });
    const response = await GET(request(), context);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Không tìm thấy" });
  });
});
