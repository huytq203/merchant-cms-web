import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, listPermissionGroups, listPermissionCatalog, getPermissionGroup } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  listPermissionGroups: vi.fn(),
  listPermissionCatalog: vi.fn(),
  getPermissionGroup: vi.fn(),
}));
vi.mock("@/lib/auth/session", () => ({ getServerSession }));
vi.mock("@/server/modules/permissions/permission.service", () => ({
  listPermissionGroups,
  listPermissionCatalog,
  getPermissionGroup,
}));
import { GET as list } from "./route";
import { GET as catalog } from "./catalog/route";
import { GET as detail } from "./[id]/route";

const unauthorized = { success: false, error: { status: 401, code: "HTTP_401", message: "Phiên đăng nhập đã hết hạn" } };
const id = "11111111-1111-4111-8111-111111111111";
const merchantId = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ merchantIds: [merchantId], subMerchantIds: [], permissions: ["MANAGE_PERMISSION_GROUP"] });
  listPermissionGroups.mockResolvedValue(unauthorized);
  listPermissionCatalog.mockResolvedValue(unauthorized);
  getPermissionGroup.mockResolvedValue(unauthorized);
});

describe("permission group routes when the BE chain answers 401", () => {
  it("answers 403, never 401, so the browser does not end the session", async () => {
    const responses = [
      await list(new Request("http://localhost/api/v1/admin/permission-groups")),
      await catalog(),
      await detail(new Request("http://localhost"), { params: Promise.resolve({ id }) }),
    ];
    expect(responses.map((response) => response.status)).toEqual([403, 403, 403]);
  });
});
