import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, getPermissionGroup } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getPermissionGroup: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("../permission.service", () => ({ getPermissionGroup }));
import { requireOwnedPermissionGroup, requirePermissionGroupAccess, selectPermissionGroupMerchant } from "../require-permission-group-access";

const merchantId = "11111111-1111-4111-8111-111111111111";
const user = { merchantIds: [merchantId], permissions: ["MANAGE_PERMISSION_GROUP"] };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue(user);
});

describe("permission group access", () => {
  it("returns 401 without session", async () => {
    getServerSession.mockResolvedValue(null);
    const result = await requirePermissionGroupAccess();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns 403 without permission", async () => {
    getServerSession.mockResolvedValue({ ...user, permissions: [] });
    const result = await requirePermissionGroupAccess();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("rejects an unowned merchant", () => {
    const result = selectPermissionGroupMerchant(user as never, "other");
    expect(result).toHaveProperty("status", 403);
  });

  it("hides a group owned by another merchant", async () => {
    getPermissionGroup.mockResolvedValue({ success: true, data: { merchantId: "other", system: false } });
    const result = await requireOwnedPermissionGroup("group", user as never);
    expect(result).toHaveProperty("status", 404);
  });
});
