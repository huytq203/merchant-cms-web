import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listUsers, createUser, getPermissionGroup } = vi.hoisted(() => ({
  getServerSession: vi.fn(), listUsers: vi.fn(), createUser: vi.fn(), getPermissionGroup: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/users/user.service", () => ({ listUsers, createUser }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ getPermissionGroup }));
import { GET, POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "22222222-2222-4222-8222-222222222222";
const session = { userId: "actor", merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_USER"] };
const body = {
  email: "user@example.com",
  fullName: "Test User",
  groupIds: [groupId],
  merchantIds: [merchantId],
  subMerchantIds: [],
};
const foreignMerchantId = "33333333-3333-4333-8333-333333333333";
const postRequest = (payload: unknown) => new Request("http://localhost/api/v1/admin/merchant-users", {
  method: "POST",
  body: JSON.stringify(payload),
});

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(session);
  getPermissionGroup.mockResolvedValue({ success: true, data: { id: groupId, merchantId } });
  createUser.mockResolvedValue({ success: true, data: { id: "user" } });
  listUsers.mockResolvedValue({ success: true, data: { rows: [], total: 0 } });
});

describe("merchant user collection route", () => {
  it("returns 401 without a session and 403 without permission", async () => {
    getServerSession.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...session, permissions: [] });
    expect((await GET(new Request("http://localhost/api/v1/admin/merchant-users"))).status).toBe(401);
    expect((await GET(new Request("http://localhost/api/v1/admin/merchant-users"))).status).toBe(403);
    expect(listUsers).not.toHaveBeenCalled();
  });

  it("passes the one-based page through, because the BE converts it itself", async () => {
    await GET(new Request("http://localhost/api/v1/admin/merchant-users?page=2&pageSize=10"));
    expect(listUsers).toHaveBeenCalledWith({ merchantId, page: 2, pageSize: 10 });
  });

  it("rejects a merchant outside the session", async () => {
    const response = await POST(postRequest({ ...body, merchantIds: [foreignMerchantId] }));
    expect(response.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects a group outside the session merchant scope", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id: groupId, merchantId: foreignMerchantId } });
    const response = await POST(postRequest(body));
    expect(response.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates a user whose group and merchant are in scope", async () => {
    const response = await POST(postRequest(body));
    expect(response.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: body.email }), merchantId);
  });
});
