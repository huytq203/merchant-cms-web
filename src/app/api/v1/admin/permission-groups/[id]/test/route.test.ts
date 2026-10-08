import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getPermissionGroup, updatePermissionGroup, deletePermissionGroup } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getPermissionGroup: vi.fn(),
  updatePermissionGroup: vi.fn(),
  deletePermissionGroup: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ getPermissionGroup, updatePermissionGroup, deletePermissionGroup }));
import { DELETE, GET, PUT } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const context = { params: Promise.resolve({ id }) };
const request = () => new Request(`http://localhost/api/v1/admin/permission-groups/${id}`);
const values = { code: "GROUP_1", name: "Nhóm", description: "", permissions: ["VIEW_ORDER"] };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["MANAGE_PERMISSION_GROUP"] });
  getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId, system: false } });
  deletePermissionGroup.mockResolvedValue({ success: true, data: undefined });
});

describe("permission group detail route", () => {
  it("returns 404 when group belongs to another merchant", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId: "other", system: false } });
    expect((await GET(request(), context)).status).toBe(404);
    expect((await PUT(new Request(request().url, { method: "PUT", body: JSON.stringify(values) }), context)).status).toBe(404);
    expect(updatePermissionGroup).not.toHaveBeenCalled();
  });

  it("forbids deletion of a system group without calling BE delete", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id, merchantId: null, system: true } });
    expect((await DELETE(request(), context)).status).toBe(403);
    expect(deletePermissionGroup).not.toHaveBeenCalled();
  });

  it("returns 204 after deletion", async () => {
    expect((await DELETE(request(), context)).status).toBe(204);
    expect(deletePermissionGroup).toHaveBeenCalledWith(id);
  });

  it("keeps BE deletion conflict status and message", async () => {
    deletePermissionGroup.mockResolvedValue({ success: false, error: { status: 409, code: "CONFLICT", message: "Nhóm còn người dùng" } });
    const response = await DELETE(request(), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Nhóm còn người dùng" });
  });
});
