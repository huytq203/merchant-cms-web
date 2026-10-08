import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getPermissionGroup, listGroupUsers } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getPermissionGroup: vi.fn(),
  listGroupUsers: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({
  getPermissionGroup,
  listGroupUsers,
}));
import { GET } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const ctx = (value = id) => ({ params: Promise.resolve({ id: value }) });
const request = (query = "") => new Request(
  `http://localhost/api/v1/admin/permission-groups/${id}/users${query}`,
);
const users = { rows: [{ id: "user", fullName: "A", email: "a@example.com" }], total: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({
    merchantIds: [merchantId],
    permissions: ["MANAGE_PERMISSION_GROUP"],
  });
  getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId } });
  listGroupUsers.mockResolvedValue({ success: true, data: users });
});

describe("permission group users route", () => {
  it("returns 401 without a session", async () => {
    getServerSession.mockResolvedValue(null);
    expect((await GET(request(), ctx())).status).toBe(401);
    expect(listGroupUsers).not.toHaveBeenCalled();
  });

  it("returns 403 without permission and skips the service", async () => {
    getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: [] });
    expect((await GET(request(), ctx())).status).toBe(403);
    expect(getPermissionGroup).not.toHaveBeenCalled();
    expect(listGroupUsers).not.toHaveBeenCalled();
  });

  it("returns 404 for an id that is not a UUID", async () => {
    expect((await GET(request(), ctx("not-a-uuid"))).status).toBe(404);
    expect(getPermissionGroup).not.toHaveBeenCalled();
  });

  it("returns 404 for a group of another merchant without listing users", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId: "other" } });
    expect((await GET(request(), ctx())).status).toBe(404);
    expect(listGroupUsers).not.toHaveBeenCalled();
  });

  it.each(["?page=0", "?page=abc"])("rejects invalid page %s", async (query) => {
    expect((await GET(request(query), ctx())).status).toBe(400);
    expect(listGroupUsers).not.toHaveBeenCalled();
  });

  it("lists users of an owned group with the requested page", async () => {
    const response = await GET(request("?page=2"), ctx());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(users);
    expect(listGroupUsers).toHaveBeenCalledWith(id, 2);
  });

  it("lists users of a system group that has no merchant", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId: null } });
    expect((await GET(request(), ctx())).status).toBe(200);
    expect(listGroupUsers).toHaveBeenCalledWith(id, 1);
  });

  it("keeps the BE status when listing fails", async () => {
    listGroupUsers.mockResolvedValue({
      success: false,
      error: { status: 409, code: "CONFLICT", message: "Xung đột" },
    });
    const response = await GET(request(), ctx());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Xung đột" });
  });
});
