import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getPermissionGroup, assignGroupUsers } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getPermissionGroup: vi.fn(),
  assignGroupUsers: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({ getPermissionGroup, assignGroupUsers }));

import { POST } from "../route";

const merchantId = "11111111-1111-4111-8111-111111111111";
const groupId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const context = { params: Promise.resolve({ id: groupId }) };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], permissions: ["MANAGE_PERMISSION_GROUP"] });
  getPermissionGroup.mockResolvedValue({ success: true, data: { id: groupId, merchantId, system: false } });
  assignGroupUsers.mockResolvedValue({ success: true, data: undefined });
});

describe("admin assign-users route", () => {
  it("forwards a direct UUID array and returns the BE 204 contract", async () => {
    const response = await POST(
      new Request(`http://localhost/api/v1/admin/permission-groups/${groupId}/assign-users`, {
        method: "POST",
        body: JSON.stringify([userId]),
      }),
      context,
    );

    expect(response.status).toBe(204);
    expect(assignGroupUsers).toHaveBeenCalledWith(groupId, [userId]);
  });

  it("does not send an assignment for a system group", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { id: groupId, merchantId: null, system: true } });
    const response = await POST(new Request("http://localhost", { method: "POST", body: "[]" }), context);

    expect(response.status).toBe(403);
    expect(assignGroupUsers).not.toHaveBeenCalled();
  });
});
